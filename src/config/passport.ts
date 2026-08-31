import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from "passport-jwt";
import httpStatus from 'http-status';
import config from "./config.js";
import { TokenType } from "../../generated/prisma/enums.js";
import prisma from "../client.js";


const jwtOptions = {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwtVerify: VerifyCallback= async(payload, done) => {
    try{
        if(payload.type !== TokenType.ACCESS) {
            throw new Error('invalid token type')
        }

        const tenant = await prisma.tenant.findUnique({
            select:{
                id: true,
                email: true,
                name: true
            },
            where: {id : payload.sub}
        })
        if(!tenant) {
            return done(false, null)
        }

        done(null, tenant)
    }catch(error){
        done(error, false)
    }
}

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify)