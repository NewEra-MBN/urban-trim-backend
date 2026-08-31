import { Request, Response, NextFunction } from "express";
import httpStatus from  'http-status';
import pick from "../utils/pick.js";
import { ApiError } from "../utils/ApiError.js";
import Joi from "joi";


const validate = (schema : any) => (req: Request, res: Response, next: NextFunction) => {
    const obj = pick(req, Object.keys(schema) as (keyof Request)[]);

    const { value , error } = Joi.compile(schema).prefs({errors: {label: 'key'}, abortEarly: false})
                            .validate(obj);

    if(error) {
        const errorMessage = error.details.map(details => details.message).join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage))
    }

    Object.assign(req, value)
    next()
}

export default validate;