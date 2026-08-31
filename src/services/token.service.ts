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
     }

     return jwt.sign(payload, secret)
}

// save token 
const saveToken = async(
    token: string,
    userId: number,
    expires: Moment,
    type: TokenType,
    blacklisted = false
): Promise<Token> => {
    const createdToken = await prisma.token.create({
        data: {
            token,
            tenantId: userId,
            expires: expires.toDate(),
            type,
            blacklisted
        }
    })
    return createdToken
}



// verify token 
const verifyToken =  async(token: string, type: TokenType):Promise<Token> => {
    const payload = jwt.verify(token, config.jwt.secret);
    const tenantId = Number(payload.sub)
    
    const tokenData = await prisma.token.findFirst({
        where: {token, type, tenantId, blacklisted: false}
    });

    if(!tokenData) {
        throw new Error('Token not found')
    }

    return tokenData
}   

// generate authentication token 
const generateAuthTokens = async(tenant: {id: number}): Promise<AuthTokensResponse> => {

    // refresh token
    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays,'days')
    const refreshToken = generateToken(tenant.id, refreshTokenExpires, TokenType.REFRESH)
    await saveToken(refreshToken, tenant.id, refreshTokenExpires, TokenType.REFRESH)
    //accessToken 
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes')
    const accessToken = generateToken(tenant.id, accessTokenExpires, TokenType.ACCESS)

    return {
        access:{
            token: accessToken,
            expires: accessTokenExpires.toDate()
        },
        refresh:{
            token: refreshToken,
            expires: refreshTokenExpires.toDate()
        }
    }
}

//reset password tokens
const generateResetPasswordToken = async(email: string):Promise<string> => {
    const user = await userServices.getUserByEmail(email)

    if(!user){
        throw new ApiError(httpStatus.NOT_FOUND,'No tenant found with this email')
    }

    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes')

    const resetToken = generateToken(user.id, expires, TokenType.RESET_PASSWORD)
    
    await saveToken(resetToken, user.id, expires, TokenType.RESET_PASSWORD)

    return resetToken
}


// verify email 

const generateVerifyEmailToken = async(tenant: {id: number}): Promise<string> => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes')
    
    const verifyEmailToken = generateToken(tenant.id, expires, TokenType.VERIFY_EMAIL);

    await saveToken(verifyEmailToken, tenant.id, expires, TokenType.VERIFY_EMAIL)

    return verifyEmailToken
}



export default {
    generateToken, 
    verifyToken,
    saveToken, 
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken
};