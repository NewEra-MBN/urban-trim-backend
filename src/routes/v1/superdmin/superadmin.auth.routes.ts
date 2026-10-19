import { Router } from "express";
import validate from "../../../middlewares/validate.js";
import authValidation from "../../../validations/auth.validation.js";
import superadminAuthController from "../../../controllers/superadminControllers/superadmin.auth.controller.js";
import rateLimit from "../../../rateLimit.js";
const router = Router();

router.post('/login', rateLimit.loginLimiter, validate(authValidation.login), superadminAuthController.login);
router.post('/logout', validate(authValidation.logout), superadminAuthController.logout);

router.post(
    '/refresh-tokens',
    validate(authValidation.refreshTokens),
    superadminAuthController.refreshTokens
);

router.post(
    '/forgot-password',
    validate(authValidation.forgotPassword),
    superadminAuthController.forgotPassword
);


router.post(
    '/reset-password',
    validate(authValidation.resetPassword),
    superadminAuthController.resetPassword
)

export default router