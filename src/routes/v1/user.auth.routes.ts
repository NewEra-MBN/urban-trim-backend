import { Router } from "express";
const router = Router();
import authControllers from "../../controllers/authControllers/auth.controllers.js";
import authValidation from "../../validations/auth.validation.js";
import validate from "../../middlewares/validate.js";
import auth from "../../middlewares/authUser.js";
import rateLimit from "../../rateLimit.js";

router.post('/register',validate(authValidation.register), authControllers.register)
router.post('/login',rateLimit.loginLimiter, validate(authValidation.login), authControllers.login)
router.post('/logout', validate(authValidation.logout), authControllers.logout)
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authControllers.refreshTokens)
router.post('/forgot-pass', validate(authValidation.forgotPassword), authControllers.forgotPassword)
router.post('/reset-pass',validate(authValidation.resetPassword), authControllers.resetPassword)
router.post('/send-verification-email',auth(),authControllers.sendVerificationEmail)
router.post('/verify-email', validate(authValidation.verifyEmail), authControllers.verifyEmail)




export default router

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     summary: Log in as a shop user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: sato@ubantrim.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Returns user and tokens
 *       401:
 *         description: Incorrect email or password
 */


/**
 * @openapi
 * /v1/auth/register:
 *  post:
 *    summary: Register as a new shop and a owner
 *    tags: [Auth]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type:  object
 *            required: [tenantName, name, email, password]
 *            properties:
 *              tenantName:
 *                type: string
 *                example: urban Trim Shinjuku
 *              name:
 *                type: string
 *                example: Sato
 *              email:
 *                type: string
 *                example: sato@ubantrim.com
 *              password:
 *                type: string
 *                example: Password123
 * 
 *    responses:
 *      201:
 *        description: Account created
 *      400:
 *        description: validation error or email already taken
 */



/**
 * @openapi
 * /v1/auth/logout:
 *   post:
 *     summary: logout as a staff of shop;
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: exyekjsdofaskdfjasi2343
 *   
 *     responses:
 *       204:
 *         description: Logged Out successfully (No content)
 *       400:
 *         description: Token is missing.
 *       404:
 *         description: refresh token not found (wrong, or already logged out)
 */

/**
 * @openapi
 * /v1/auth/refresh-tokens:
 *   post:
 *     summary: Refresh the token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: sdfwocmnv2938491fnsaodf
 *     responses:
 *       200:
 *         description: return new refresh and access tokens
 *       400:
 *         description: Refresh Token required
 *       401:
 *         description: Please Authenticate
 */




/**
 * @openapi
 * /v1/auth/forgot-pass:
 *   post:
 *     summary: Send Forgot Pass token to the email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: sato@ubantrim.com
 *     responses:
 *       204:
 *         description: Success(with no Content) Token sent to the mail address
 *       400:
 *         description: email is required
 *       404:
 *         description: No user found with this email
 */



/**
 * @openapi
 * /v1/auth/reset-pass:
 *   post:
 *     summary:  Reset the password
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       204:
 *         description: Password Changed
 *       400:
 *         description: Token or password missing, or pasword too weak
 *       401:
 *         description: Password reset failed (invalid or expired token)
 */


/**
 * @openapi
 * /v1/auth/send-verification-email:
 *   post:
 *     summary: send a verification to the login user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: verification email sent
 *       401:
 *         description: Please authenticate
 */


/**
 * @openapi
 * /v1/auth/verify-email:
 *   post:
 *     summary:  Verify the email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: false
 *         schema:
 *         type: string     
 *     responses:
 *       204:
 *         description: email verified
 *       400:
 *         description: Token or password missing, or pasword too weak
 *       401:
 *         description: Password reset failed (invalid or expired token)
 */