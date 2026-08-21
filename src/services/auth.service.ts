import userServices from "./user.services.js";
import tokenService from "./token.service.js";
import httpStatus from 'http-status';
import prisma from "../client.js";
import { encryptPassword, isPasswordMatch } from "../utils/encryption.js";
import { Tenant, TokenType } from "../../generated/prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import exclude from "../utils/exclude.js";
import { AuthTokensResponse } from "../types/responseType.js";


/*
    Login User with
    email and Password

*/

const loginTenantWithEmailandPassword = async (email: string, password: string): Promise<Omit<Tenant, 'password'>> => {
    const tenant = await userServices.getTenantByEmail(email)
    if (!tenant || await (isPasswordMatch(password, tenant.password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password')
    }
    return exclude(tenant, ['password'])
}



/*
    Logout 
*/

const logout = async (refreshToken: string): Promise<void> => {
    const refreshTokenData = await prisma.token.findFirst({
        where: {
            token: refreshToken,
            type: TokenType.REFRESH,
            blacklisted: false
        }
    })

    if (!refreshTokenData) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Not found')
    }

    await prisma.token.delete({ where: { id: refreshTokenData.id } })
}


/*
    RefreshAuth
*/


const refreshAuth = async (refreshToken: string): Promise<AuthTokensResponse> => {
    try {
        const refreshTokenData = await tokenService.verifyToken(refreshToken, TokenType.REFRESH);
        const { tenantId } = refreshTokenData;
        prisma.token.delete({
            where: { id: refreshTokenData.id }
        })
        return tokenService.generateAuthTokens({ id: tenantId })
    } catch {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
    }
}

/*
    reset password 
    token 
*/

const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
    try {
        const resetPasswordTokenData = await tokenService.verifyToken(resetPasswordToken, TokenType.RESET_PASSWORD);
        const tenant = await userServices.getTenantById(resetPasswordTokenData.tenantId);
        if (!tenant) {
            throw new Error();
        }
        const encryptedPassword = await encryptPassword(newPassword);
        await userServices.updateTenantById(tenant.id, { password: encryptedPassword })
        await prisma.token.deleteMany({
            where: {
                tenantId: tenant.id,
                type: TokenType.RESET_PASSWORD,
            }
        })
    } catch (error) {
        throw new ApiError(
            httpStatus.UNAUTHORIZED,
            'Password reset failed'
        )
    }
}

const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
    try {
        const verifyEmailTokenData = await tokenService.verifyToken(verifyEmailToken, TokenType.VERIFY_EMAIL);

        await prisma.token.deleteMany({
            where: { tenantId: verifyEmailTokenData.tenantId, type: TokenType.VERIFY_EMAIL }
        })

        await userServices.updateTenantById(verifyEmailTokenData.tenantId, { isEmailVerfied: true })
    } catch(error){
        throw new ApiError(httpStatus.UNAUTHORIZED,'Email verificaiton failed')
    }
}



export default {
    loginTenantWithEmailandPassword, 
    logout, 
    refreshAuth,
    resetPassword,
    verifyEmail
}