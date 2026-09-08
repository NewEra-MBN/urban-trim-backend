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
import { Role } from '../../../generated/prisma/enums.js';

const register = catchAsync(async(req, res) => {
    console.log('register hitted')
    const {tenantName, name, email, password} = req.body;
    const tenant = await userServices.createTenant(tenantName);
    console.log(tenant)
    const user = await userServices.createUser(name, email, password, Role.OWNER, tenant.id)
    console.log(user)
    const safeUser = exclude(user, ['password','createdAt','updatedAt']);
    const tokens = await tokenService.generateAuthTokens({kind:'user',userId: user.id});
    res.status(httpStatus.CREATED).send({safeUser, tokens})
})

const login = catchAsync(async(req, res) => {
    const {email, password} = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    console.log(user)
    const token = await tokenService.generateAuthTokens(user)
    res.send({user, token})
})


const logout = catchAsync(async(req, res) => {
    await authService.logout(req.body.refreshToken)
    res.status(httpStatus.NO_CONTENT).send()
})

const refreshTokens = catchAsync(async(req, res) => {
    console.log('refresh token hitted')
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    console.log(tokens)
    res.send({...tokens});
})

const forgotPassword = catchAsync(async(req, res) => {
    const {email} = req.body;
    const token = await tokenService.generateResetPasswordToken(email);
    await emailService.sendResetPasswordEmail(email, token)
    res.status(httpStatus.NO_CONTENT).send();
});


const resetPassword = catchAsync(async(req, res) => {
    const token = req.query.token as string;
    console.log('here is the token',token)
    const {password} = req.body;
    console.log(password)
    await authService.resetPassword(token, password)
    res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async(req, res) => {
    const user = req.user;
    if(!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'please authenticate')
    }
    const token = await tokenService.generateVerifyEmailToken(user);
    await emailService.sendVerificationEmail(user.email, token);
    res.status(httpStatus.NO_CONTENT).send();
});


const  verifyEmail = catchAsync(async(req,res) => {
    const token = req.query.token as string;
    await authService.verifyEmail(token);
    res.status(httpStatus.NO_CONTENT).send()
})



export default {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail
}