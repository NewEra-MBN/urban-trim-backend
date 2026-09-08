import { Request, Response, NextFunction } from "express"
import passport from "passport"
import { ApiError } from "../utils/ApiError.js"
import httpStatus from 'http-status'

const verifyCallback = (
    req: Request,
    resolve: (value?: unknown) => void,
    reject: (reson?: unknown)=> void,
) => (err: unknown, superAdmin: any, info: unknown)  => {
    if(err || info || !superAdmin) {
        return reject(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"))
    }

    req.superAdmin = superAdmin;
    resolve();
}

const authSuperAdmin = async(req : Request, res : Response, next : NextFunction )=> {
    return new Promise((resolve, reject) => {
        passport.authenticate(
            "jwt-superadmin",
            {session: false},
            verifyCallback(req, resolve, reject)
        )(req, res, next)
    })
        .then(() => next())
        .catch((err) => next(err))
}

export default authSuperAdmin;