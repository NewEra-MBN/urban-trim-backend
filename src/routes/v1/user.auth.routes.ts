import { Router } from "express";
const router = Router();
import authControllers from "../../controllers/authControllers/auth.controllers.js";
import authValidation from "../../validations/auth.validation.js";
import validate from "../../middlewares/validate.js";
import auth from "../../middlewares/authUser.js";

router.post('/register',validate(authValidation.register), authControllers.register)
router.post('/login',validate(authValidation.login), authControllers.login)
router.post('/logout', validate(authValidation.logout), authControllers.logout)
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authControllers.refreshTokens)
router.post('/forgot-pass', validate(authValidation.forgotPassword), authControllers.forgotPassword)
router.post('/reset-pass',validate(authValidation.resetPassword), authControllers.resetPassword)
router.post('/send-verification-email',auth(),authControllers.sendVerificationEmail)
router.post('/verify-email', validate(authValidation.verifyEmail), authControllers.verifyEmail)




export default router