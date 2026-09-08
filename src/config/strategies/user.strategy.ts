import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from "passport-jwt";
import httpStatus from 'http-status';
import config from "../config.js";
import { TokenType } from "../../../generated/prisma/enums.js";
import prisma from "../../client.js";


const jwtOptions = {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwtVerify: VerifyCallback= async(payload, done) => {
    console.log(payload)
    try{
        if(payload.type !== TokenType.ACCESS) {
            throw new Error('invalid token type')
        }

        const user = await prisma.user.findUnique({
            select:{
                id: true,
                email: true,
                name: true,
                tenantId:true,
                role: true,
            },
            where: {id : payload.sub}
        })
        console.log(user)
        if(!user) {
            return done(false, null)
        }

        done(null, user)
    }catch(error){
        done(error, false)
    }
}

export const userJwtStrategy = new JwtStrategy(jwtOptions, jwtVerify)