import { ErrorRequestHandler } from "express";
import httpStatus from 'http-status'
import { ApiError } from "../utils/ApiError.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import dotenv from 'dotenv'
dotenv.config()

export const errorConverter: ErrorRequestHandler = (err, req, res, next) => {
    let error = err;
    if(!(error instanceof ApiError)) {
        const statusCode = 
            error instanceof PrismaClientKnownRequestError ? httpStatus.BAD_REQUEST 
            : httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || httpStatus[statusCode];
        error = new ApiError(statusCode, message, false, err.stack)
    }
    next(error)
}



export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    let {statusCode, message} = err;
    
    if(process.env.NODE_ENV === 'production' && !err.isOperational) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR]
    };

    res.locals.errorMessage = err.message;

    const response = {
        statusCode: statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    }

   res.status(statusCode).send(response)
}