import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from "passport-jwt";
import config from "../config.js";
import { TokenType } from "../../../generated/prisma/enums.js";
import prisma from "../../client.js";

const jwtOptions = {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
}

const jwtVerify : VerifyCallback = async (payload, done) => {
    try{
        if(payload.type !== TokenType.ACCESS) {
            done(null, false)
        }

        const customer = await prisma.customer.findUnique({
            where: {id: payload.sub},
            select:{
                id: true,
                name: true,
                email: true,
                phone: true,
                tenantId: true
            }
        })

        if(!customer) {
           return done(null, false)
        } 

        done(null, customer)
    }catch(error){
        done(error, false)
    }
}


export const customerJwtStrategy = new JwtStrategy(jwtOptions, jwtVerify)