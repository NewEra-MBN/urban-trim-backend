import jwt from 'jsonwebtoken'
import moment, {Moment} from 'moment'
import { HttpStatus } from 'http-status'
import config from '../config/config.js';
import userServices from './user.services.js';
import { ApiError } from '../utils/ApiError.js';
import { Token, TokenType } from '../../generated/prisma/client.js';
import prisma from '../client.js';
import { AuthTokensResponse } from '../types/responseType.js';

/**
 *Generate Token
 */

/**
 * Generate token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */

const generateToken = (
    tenantId: number,
    expires: Moment,
    type: TokenType,
    secret = config.jwt.secret
): string => {
     const payload = {
        sub: tenantId,
        iat: moment().unix(),
        exp: expires.unix(),
        type
     }

     return jwt.sign(payload, secret)
}

// save token 
const saveToken = async(
    token: string,
    tenantId: number,
    expires: Moment,
    type: TokenType,
    blacklisted = false
): Promise<Token> => {
    const createdToken = await prisma.token.create({
        data: {
            token,
            tenantId: tenantId,
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