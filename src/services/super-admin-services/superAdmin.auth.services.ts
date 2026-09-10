import { ApiError } from "../../utils/ApiError.js";
import { encryptPassword, isPasswordMatch } from "../../utils/encryption.js";
import superAdminServices from "./superAdmin.services.js";
import httpStatus from 'http-status'
import tokenService from "../token.service.js";
import { OwnerType, SuperAdmin, Token, TokenType, User } from "../../../generated/prisma/client.js";
import prisma from "../../client.js";
import { AuthTokensResponse } from "../../types/responseType.js";

/**
 * 
 * @param email 
 * @param password 
 * @returns 
 */
const loginSuperAdminWithEmailandPassword = async (email: string, password: string): Promise<Omit<SuperAdmin, 'password'>> => {
    const superAdmin = await superAdminServices.getSuperAdminByEmail(email);

    if (!superAdmin || !(await isPasswordMatch(superAdmin.password, password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "incorrect email or password")
    }
    return superAdmin as Promise<Omit<SuperAdmin, 'password'>>;
}

const logout = async (refreshToken: string): Promise<void> => {
    const refreshTokenData = await prisma.token.findFirst({
        where: { token: refreshToken, type: TokenType.REFRESH, blacklisted: false }
    })

    if (!refreshTokenData) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Token not found')
    }

    await prisma.token.delete({
        where: { id: refreshTokenData.id }
    })
}


const refreshAuth = async (refreshToken: string): Promise<AuthTokensResponse> => {
    try {
        const refreshTokenData = await tokenService.verifyToken(refreshToken, TokenType.REFRESH);
        const { ownerId } = refreshTokenData;
        await prisma.token.delete({
            where: { id: refreshTokenData.id }
        })
        return await tokenService.generateAuthTokens(OwnerType.SUPERADMIN, ownerId);
    } catch(err) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
    }
}

const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
    try{
        const resetPassTokenData = await tokenService.verifyToken(resetPasswordToken, TokenType.RESET_PASSWORD);

        const superAdmin= await superAdminServices.getSuperAdminById(resetPassTokenData.ownerId);
        
        if(!superAdmin) {
            throw new Error();
        }

        const encryptedPassword = await encryptPassword(newPassword)

        await prisma.superAdmin.update({
            where:{id: superAdmin.id},
            data: {password : encryptedPassword}
        })
        
        await prisma.token.deleteMany({
            where: {ownerId: resetPassTokenData.ownerId, type: TokenType.RESET_PASSWORD}
        })
    }catch(err){
        throw new ApiError(httpStatus.UNAUTHORIZED,"Please authenticate")
    }
}

export default {
    loginSuperAdminWithEmailandPassword,
    logout,
    refreshAuth,
    resetPassword
}




