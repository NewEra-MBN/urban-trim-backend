
import { OwnerType } from "../../../generated/prisma/enums.js";
import emailService from "../../services/email.service.js";
import superAdminAuthServices from "../../services/super-admin-services/superAdmin.auth.services.js";
import tokenService from "../../services/token.service.js";
import { ApiError } from "../../utils/ApiError.js";
import catchAsync from "../../utils/catchAsync.js";
import httpStatus from 'http-status'

const login = catchAsync(async (req, res) => {
    const {email , password} = req.body;

    const superAdmin = await superAdminAuthServices.loginSuperAdminWithEmailandPassword(email, password);

    const tokens = await tokenService.generateAuthTokens(OwnerType.SUPERADMIN, superAdmin.id);

    res.send({superAdmin, tokens})
})



const logout  = catchAsync(async (req, res)=> {
    await superAdminAuthServices.logout(req.body.refreshToken)
    res.status(httpStatus.NO_CONTENT).send()
})


const refreshTokens =  catchAsync(async(req, res) => {
    const refreshToken = req.body.refreshToken;
    if(!refreshToken) throw new ApiError(httpStatus.UNAUTHORIZED, 'RefreshToken Needed')
    const tokens = await superAdminAuthServices.refreshAuth(refreshToken);
    res.send(tokens).send()
})



const forgotPassword = catchAsync(async(req, res) => {
    const {email} = req.body;

    const resetPasswordToken = await tokenService.generateResetPasswordToken(OwnerType.SUPERADMIN, email);

    await emailService.sendResetPasswordEmail(email, resetPasswordToken);

    res.status(httpStatus.NO_CONTENT).send()
})


const resetPassword = catchAsync(async(req, res) => {
    await superAdminAuthServices.resetPassword(req.query.token as string, req.body.password);
    res.status(httpStatus.NO_CONTENT).send()
})




export default {
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword
}