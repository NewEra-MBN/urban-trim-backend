import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync.js';
import authService from '../../services/auth.service.js';
import exclude from '../../utils/exclude.js';
import userServices from '../../services/tenant&user.services.js';
import tokenService from '../../services/token.service.js';
import emailService from '../../services/email.service.js';
import passport from 'passport';
import User from '@prisma/client'
import { ApiError } from '../../utils/ApiError.js';
import { Tenant } from '../../../generated/prisma/client.js';

const register = catchAsync(async(req, res) => {
    const {name, email, password} = req.body;
    const tenant = await userServices.createTenant(name, email, password);
    const safeTenant = exclude(tenant, ['password','createdAt','updatedAt']);
    const tokens = await tokenService.generateAuthTokens(tenant);
    res.status(httpStatus.CREATED).send({safeTenant, tokens})
})

const login = catchAsync(async(req, res) => {
    const {email, password} = req.body;
    const tenant = await authService.loginTenantWithEmailandPassword(email, password);
    const token = await tokenService.generateAuthTokens(tenant)
    res.send({tenant, token})
})


const logout = catchAsync(async(req, res) => {
    await authService.logout(req.body.refreshToken)
    res.status(httpStatus.NO_CONTENT).send()
})


const forgotPassword = catchAsync(async(req, res) => {
    const {email} = req.body;
    const token = await tokenService.generateResetPasswordToken(email);
    await emailService.sendResetPasswordEmail(email, token)
    res.status(httpStatus.NO_CONTENT).send();
});


const resetPassword = catchAsync(async(req, res) => {
    const {resetPasswordToken, newPassword} = req.body;
    await authService.resetPassword(resetPasswordToken, newPassword)
    res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async(req, res) => {
    const tenant = req.user;
    if(!tenant) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'please authenticate')
    }
    const token = await tokenService.generateVerifyEmailToken(tenant);
    await emailService.sendVerificationEmail(tenant.email, token);
    res.status(httpStatus.NO_CONTENT).send();
});


const  verifyEmail = catchAsync(async(req,res) => {
    const {token} = req.body;
    await authService.verifyEmail(token);
    res.status(httpStatus.NO_CONTENT).send()
})



export default {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail
}