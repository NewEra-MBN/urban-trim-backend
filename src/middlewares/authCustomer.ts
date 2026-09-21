import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Customer } from "../../generated/prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import httStatus from 'http-status';

const verifyCallback = (
        req : Request,
        resolve: (value?:unknown) => void,
        reject: (value?:unknown) => void 
    ) => 
        async (err: unknown, customer: Customer | false, info: unknown) => {
            if(err || !customer || info)  {
                return reject(new ApiError(httStatus.UNAUTHORIZED, "Please authenticate"))
            }

            req.customer = customer;

            resolve()
        }



const customerAuth = async (req : Request, res : Response, next: NextFunction) => {
    new Promise((resolve, reject) => {
        passport.authenticate(
            'jwt-customer',
            {session: false},
            verifyCallback(req, resolve, reject)
        )(req, res, next);
    })
        .then(() => next())
        .catch((err) => next(err))
}

export default customerAuth