import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync.js';
import authService from '../../services/user.auth.service.js';
import exclude from '../../utils/exclude.js';
import userServices from '../../services/tenant&user.services.js';
import tokenService from '../../services/token.service.js';
import emailService from '../../services/email.service.js';
import passport from 'passport';
import User from '@prisma/client'
import { ApiError } from '../../utils/ApiError.js';
import { OwnerType, Role, Tenant } from '../../../generated/prisma/client.js';

const register = catchAsync(async(req, res) => {
    const {tenantName, name, email, password} = req.body;
    const tenant = await userServices.createTenant(tenantName,email);
    const user = await userServices.createUser(name, email, password, Role.OWNER, tenant.id)
     const safeUser = exclude(user, ['password','updatedAt', 'createdAt']);
    const tokens = await tokenService.generateAuthTokens(OwnerType.USER, user.id);
    res.status(httpStatus.CREATED).send({safeUser, tokens})
})

const login = catchAsync(async(req, res) => {
    const {email, password} = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password)
    const token = await tokenService.generateAuthTokens(OwnerType.USER, user.id)
    res.send({user, token})
})


const logout = catchAsync(async(req, res) => {
    await authService.logout(req.body.refreshToken)
    res.status(httpStatus.NO_CONTENT).send()
})

const refreshTokens = catchAsync(async(req,res) => {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    res.send({...tokens})
})


const forgotPassword = catchAsync(async(req, res) => {
    const {email} = req.body;
    const token = await tokenService.generateResetPasswordToken(OwnerType.USER, email);
    await emailService.sendResetPasswordEmail(email, token)
    res.status(httpStatus.NO_CONTENT).send();
});


const resetPassword = catchAsync(async(req, res) => {
    const {resetPasswordToken, newPassword} = req.body;
    await authService.resetPassword(resetPasswordToken, newPassword)
    res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async(req, res) => {
    const user = req.user;
    if(!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'please authenticate')
    }
    const token = await tokenService.generateVerifyEmailToken(OwnerType.USER, user.id, user.tenantId);
    await emailService.sendVerificationEmail(user.email, token);
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
    verifyEmail,
    refreshTokens
}