import jwt from 'jsonwebtoken'
import moment, { Moment } from 'moment'
import httpStatus from 'http-status'
import config from '../config/config.js';
import userServices from './tenant&user.services.js';
import { ApiError } from '../utils/ApiError.js';
import { Token, TokenType, OwnerType } from '../../generated/prisma/client.js';
import prisma from '../client.js';
import { AuthTokensResponse } from '../types/responseType.js';
import superAdminServices from './super-admin-services/superAdmin.services.js';
/**
 *Generate Token
 */


const generateToken = (
    ownerId: string,
    expires: Moment,
    type: TokenType,
    secret = config.jwt.userSecret,
    tenantId?: string,
): string => {
    const payload: Record<string, any> = {
        sub: ownerId,
        iat: moment().unix(),
        exp: expires.unix(),
        type
    };

    if (tenantId) payload.tenantId = tenantId;


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
const verifyToken = async (ownerType: OwnerType, token: string, type: TokenType): Promise<Token & { tenantId?: string }> => {

    const jwtSecret = ownerType === 'SUPERADMIN' ? config.jwt.superAdminSecret : config.jwt.userSecret
    const payload = jwt.verify(token, jwtSecret);

    if (typeof payload === "string" || !payload.sub) {
        throw new Error("Invalid token payload");
    }

    const ownerId = payload.sub;
    const tenantId = payload.tenantId;

    const tokenData = await prisma.token.findFirst({
        where: { token, type, ownerId, blacklisted: false }
    });

    if (!tokenData) {
        throw new Error("Token not found");
    }

    return { ...tokenData, ...(tenantId && { tenantId }) }
};

// generate authentication tokens
const generateAuthTokens = async (ownerType: OwnerType, ownerId: string, tenantId?: string): Promise<AuthTokensResponse> => {

    if (ownerType === 'USER' && !tenantId) {
        throw new Error("Tenant Id is required for User Tokens")
    }

    const secret = ownerType === "SUPERADMIN" ? config.jwt.superAdminSecret : config.jwt.userSecret
    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, "days");

    const refreshToken = generateToken(ownerId, refreshTokenExpires, TokenType.REFRESH, secret, tenantId);
    await saveToken(refreshToken, refreshTokenExpires, TokenType.REFRESH, ownerType, ownerId);

    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, "minutes");
    const accessToken = generateToken(ownerId, accessTokenExpires, TokenType.ACCESS, secret, tenantId);

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
     const jwtSecret = ownerType === 'SUPERADMIN' ? config.jwt.superAdminSecret : config.jwt.userSecret;
     const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, "minutes");

    let resetToken : string;
    let ownerId: string;

    if(ownerType === 'SUPERADMIN') {
        const superAdmin = await superAdminServices.getSuperAdminByEmail(email);
        if(!superAdmin) throw new ApiError(httpStatus.NOT_FOUND, 'no owner found with this email')
        ownerId = superAdmin.id;
        resetToken = generateToken(superAdmin.id, expires, TokenType.RESET_PASSWORD, jwtSecret)
    }else{
        const user = await userServices.getUserByEmail(email);
        if(!user) throw new ApiError(httpStatus.NOT_FOUND, 'No owner found with this email');
        ownerId = user.id;
        resetToken = generateToken(user.id, expires, TokenType.RESET_PASSWORD, jwtSecret, user.tenantId)
    }

    await saveToken(resetToken, expires, TokenType.RESET_PASSWORD, ownerType, ownerId);

    return resetToken;
};

// verify email token

const generateVerifyEmailToken = async (ownerType: OwnerType, ownerId: string, tenantId?:string): Promise<string> => {

    if(ownerType === 'USER' && !tenantId) {
        throw new Error("user must need a tenant id")
    }

    const jwtSecret = ownerType === 'SUPERADMIN' ? config.jwt.superAdminSecret : config.jwt.userSecret;

    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, "minutes");

    const verifyEmailToken = generateToken(ownerId, expires, TokenType.VERIFY_EMAIL, jwtSecret, tenantId);

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