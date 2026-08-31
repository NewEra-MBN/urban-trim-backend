import jwt from 'jsonwebtoken'
import moment, {Moment} from 'moment'
import httpStatus from 'http-status'
import config from '../config/config.js';
import userServices from './user.services.js';
import { ApiError } from '../utils/ApiError.js';
import { Token, TokenType } from '../../generated/prisma/client.js';
import prisma from '../client.js';
import { AuthTokensResponse } from '../types/responseType.js';

/**
 *Generate Token
 */


const generateToken = (
    userId: number,
    expires: Moment,
    type: TokenType,
    secret = config.jwt.secret
): string => {
    const payload = {
        sub: userId,
        iat: moment().unix(),
        exp: expires.unix(),
        type
    };

    return jwt.sign(payload, secret);
};

// save token
const saveToken = async (
    token: string,
    userId: number,
    expires: Moment,
    type: TokenType,
    blacklisted = false
): Promise<Token> => {
    return prisma.token.create({
        data: {
            token,
            userId,
            expires: expires.toDate(),
            type,
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

    const userId = Number(payload.sub);

    const tokenData = await prisma.token.findFirst({
        where: { token, type, userId, blacklisted: false }
    });

    if (!tokenData) {
        throw new Error("Token not found");
    }

    return tokenData;
};

// generate authentication tokens
const generateAuthTokens = async (user: { id: number }): Promise<AuthTokensResponse> => {
    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, "days");
    const refreshToken = generateToken(user.id, refreshTokenExpires, TokenType.REFRESH);
    await saveToken(refreshToken, user.id, refreshTokenExpires, TokenType.REFRESH);

    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, "minutes");
    const accessToken = generateToken(user.id, accessTokenExpires, TokenType.ACCESS);

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
const generateResetPasswordToken = async (email: string): Promise<string> => {
    const user = await userServices.getUserByEmail(email);

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "No user found with this email");
    }

    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, "minutes");
    const resetToken = generateToken(user.id, expires, TokenType.RESET_PASSWORD);

    await saveToken(resetToken, user.id, expires, TokenType.RESET_PASSWORD);

    return resetToken;
};

// verify email token
const generateVerifyEmailToken = async (user: { id: number }): Promise<string> => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, "minutes");

    const verifyEmailToken = generateToken(user.id, expires, TokenType.VERIFY_EMAIL);

    await saveToken(verifyEmailToken, user.id, expires, TokenType.VERIFY_EMAIL);

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