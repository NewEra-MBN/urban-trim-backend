import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from "passport-jwt";
import { TokenType } from "../../../generated/prisma/enums.js";
import prisma from "../../client.js";
import config from "../config.js";


const jwtOptions = {
    secretOrKey: config.jwt.superAdminSecret,
    jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken()
}


const jwtVerify: VerifyCallback = async(payload, done) => {
    try{
        if(payload.type !== TokenType.ACCESS) {
            return(done(null, false))
        }

        const superAdmin = await prisma.superAdmin.findUnique({
            select: {id: true, name:true, email: true},
            where:{id: payload.sub}
        })

        if(!superAdmin) {
            return done(null, false)
        }
        done(null, superAdmin)
    }catch(error){
        done(error, false)
    }
}


export const superAdminJwtStrategy = new JwtStrategy(jwtOptions, jwtVerify)