import jwt from 'jsonwebtoken'
import moment, { Moment } from 'moment'
import httpStatus from 'http-status'
import config from '../config/config.js';
import userServices from './tenant&user.services.js';
import { ApiError } from '../utils/ApiError.js';
import { Token, TokenType, OwnerType } from '../../generated/prisma/client.js';
import prisma from '../client.js';
import { AuthTokensResponse } from '../types/responseType.js';

/**
 *Generate Token
 */


const generateToken = (
    ownerId: string,
    expires: Moment,
    type: TokenType,
    secret = config.jwt.secret
): string => {
    const payload = {
        sub: ownerId,
        iat: moment().unix(),
        exp: expires.unix(),
        type
    };

    return jwt.sign(payload, secret);
};

// save token
const saveToken = async (
    token: string,
    expires: Moment,
    type: TokenType,
    ownerType: OwnerType,
    ownerId: string,
    blacklisted = false
): Promise<Token> => {
    return prisma.token.create({
        data: {
            token,
            type,
            expires: expires.toDate(),
            ownerType,
            ownerId,
            blacklisted
        }
    });
};

// verify token
const verifyToken = async (token: string, type: TokenType): Promise<Token> => {
    const payload = jwt.verify(token, config.jwt.secret);

    if (typeof payload === "string" || !payload.sub) {
        throw new Error("Invalid token payload");
    }

    const ownerId = payload.sub;

    const tokenData = await prisma.token.findFirst({
        where: { token, type, ownerId, blacklisted: false }
    });

    if (!tokenData) {
        throw new Error("Token not found");
    }

    return tokenData;
};

// generate authentication tokens
const generateAuthTokens = async (ownerType: OwnerType, ownerId: string): Promise<AuthTokensResponse> => {
    const secret = ownerType === "SUPERADMIN" ? config.jwt.superAdminSecret : config.jwt.secret
    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, "days");
    const refreshToken = generateToken(ownerId, refreshTokenExpires, TokenType.REFRESH, secret);
    await saveToken(refreshToken, refreshTokenExpires,TokenType.REFRESH,ownerType, ownerId);

    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, "minutes");
    const accessToken = generateToken(ownerId, accessTokenExpires, TokenType.ACCESS, secret);

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate()
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate()
        }
    };
};

// reset password token
const generateResetPasswordToken = async (ownerType: OwnerType, email: string): Promise<string> => {
    let owner
    if(ownerType === 'SUPERADMIN'){
        owner = await superAdminService.getSuperAdminByEmail(email)
    }else if(ownerType === 'USER'){
        owner = await userServices.getUserByEmail(email);
    }

    if (!owner) {
        throw new ApiError(httpStatus.NOT_FOUND, "No owner found with this email");
    }

    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, "minutes");
    const resetToken = generateToken(owner.id, expires, TokenType.RESET_PASSWORD);

    await saveToken(resetToken, expires, TokenType.RESET_PASSWORD, ownerType, owner.id);

    return resetToken;
};

// verify email token
const generateVerifyEmailToken = async (ownerType: OwnerType, ownerId: string): Promise<string> => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, "minutes");

    const verifyEmailToken = generateToken(ownerId, expires, TokenType.VERIFY_EMAIL);

    await saveToken(verifyEmailToken, expires, TokenType.VERIFY_EMAIL, ownerType, ownerId)

    return verifyEmailToken;
};

export default {
    generateToken,
    verifyToken,
    saveToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken
};