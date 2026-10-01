import { Request, Response, NextFunction } from "express";
import httpStatus from 'http-status';
import { ApiError } from "../utils/ApiError.js";
import Joi from "joi";


const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    // read each part directly: in Express 5 req.query is a getter, so pick() would skip it
    const obj = Object.fromEntries(
        Object.keys(schema).map((key) => [key, req[key as keyof Request]])
    );
    const { value, error } = Joi.compile(schema).prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(obj);

    if (error) {
        const errorMessage = error.details.map(details => details.message).join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage))
    }

    // req.query is read-only in Express 5, so redefine the properties instead of assigning
    for (const [key, val] of Object.entries(value)) {
        Object.defineProperty(req, key, { value: val, writable: true, configurable: true, enumerable: true });
    }
    next()
}

export default validate;