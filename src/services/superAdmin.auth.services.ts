import { ApiError } from "../utils/ApiError.js";
import { isPasswordMatch } from "../utils/encryption.js";
import superAdminServices from "./superAdmin.services.js"
import httpStatus from 'http-status'
import tokenService from "./token.service.js";
import { Token, TokenType } from "../../generated/prisma/client.js";
import prisma from "../client.js";

const loginSuperAdminWithEmailandPassword = async(email: string, password: string) => {
    const superAdmin = await superAdminServices.getSuperAdminByEmail(email);
    
    if(!superAdmin || !(await isPasswordMatch(superAdmin.password, password))){
        throw new ApiError(httpStatus.UNAUTHORIZED, "incorrect email or password")
    }
    return superAdmin
}

const logout = async(refreshToken: string) => {
    if(!refreshToken) {
        throw new ApiError(httpStatus.BAD_REQUEST,'RefreshToken is required')
    }

    const refreshTokenData = await prisma.token.findFirst({
        where: {token: refreshToken, type: TokenType.REFRESH, blacklisted: false}
    })

    if(!refreshTokenData){
        throw new ApiError(httpStatus.NOT_FOUND, 'Token not found')
    }

    await prisma.token.delete({
        where:{id: refreshTokenData.id}
    })
}