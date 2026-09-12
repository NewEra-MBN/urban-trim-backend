import userServices from "./tenant&user.services.js";
import tokenService from "./token.service.js";
import httpStatus from "http-status";
import prisma from "../client.js";
import { encryptPassword, isPasswordMatch } from "../utils/encryption.js";
import { User, TokenType, OwnerType } from "../../generated/prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import exclude from "../utils/exclude.js";
import { AuthTokensResponse } from "../types/responseType.js";

/*
    Login User with
    email and Password
*/

const loginUserWithEmailAndPassword = async (
    email: string,
    password: string
): Promise<Omit<User, "password">> => {
    const user = await userServices.getUserByEmail(email, [
        "id",
        "name",
        "email",
        "password",
        "role",
        "tenantId",
        "isEmailVerified",
        "createdAt",
        "updatedAt"
    ]);

    if (!user || !(await isPasswordMatch(password, user.password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
    }

    return exclude(user, ["password"]);
};

/*
    Logout
*/

const logout = async (refreshToken: string): Promise<void> => {
    if (!refreshToken) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Refresh Token is Required");
    }

    const refreshTokenData = await prisma.token.findFirst({
        where: {
            token: refreshToken,
            type: TokenType.REFRESH,
            blacklisted: false
        }
    });

    if (!refreshTokenData) {
        throw new ApiError(httpStatus.NOT_FOUND, "Not found");
    }

    await prisma.token.delete({ where: { id: refreshTokenData.id } });
};

/*
    RefreshAuth
*/

const refreshAuth = async (refreshToken: string): Promise<AuthTokensResponse> => {
    try {
        const refreshTokenData = await tokenService.verifyToken(OwnerType.USER, refreshToken, TokenType.REFRESH);
        const { ownerId, tenantId } = refreshTokenData;
        
        if (!ownerId || !tenantId) {
            throw new Error("Token has no associated user");
        }

        await prisma.token.delete({ where: { id: refreshTokenData.id } });

        return tokenService.generateAuthTokens(OwnerType.USER, ownerId);
    } catch {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    }
};

/*
    Reset Password
*/

const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
    try {
        const resetPasswordTokenData = await tokenService.verifyToken(
            OwnerType.USER,
            resetPasswordToken,
            TokenType.RESET_PASSWORD
        );

        if (!resetPasswordTokenData.ownerId) {
            throw new Error("Token has no associated user");
        }

        const user = await userServices.getUserById(resetPasswordTokenData.ownerId);
        if (!user) {
            throw new Error("User not found");
        }

        const encryptedPassword = await encryptPassword(newPassword);
        await userServices.updateUserById(user.tenantId, user.id, {password: encryptedPassword});

        await prisma.token.deleteMany({
            where: {
                userId: user.id,
                type: TokenType.RESET_PASSWORD
            }
        });
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
    }
};

/*
    Verify Email
*/

const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
    try {
        const verifyEmailTokenData = await tokenService.verifyToken(verifyEmailToken, TokenType.VERIFY_EMAIL);

        if (!verifyEmailTokenData.ownerId) {
            throw new Error("Token has no associated user");
        }

        await prisma.token.deleteMany({
            where: { userId: verifyEmailTokenData.ownerId, type: TokenType.VERIFY_EMAIL }
        });

        const user = await userServices.getUserById(verifyEmailTokenData.ownerId);
        if (!user) {
            throw new Error("User not found");
        }

        await userServices.updateUserById(user.tenantId, user.id, { isEmailVerified: true });
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
    }
};

export default {
    loginUserWithEmailAndPassword,
    logout,
    refreshAuth,
    resetPassword,
    verifyEmail
};