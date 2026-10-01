import auth from "../../middlewares/authUser.js";
import validate from "../../middlewares/validate.js";
import userValidation from "../../validations/user.validation.js";
import userController from "../../controllers/user.controller.js";
import { Router } from "express";

const router = Router();

router
  .route('/')
  .post(
    auth('manage_staff'),
    validate(userValidation.createUser),
    userController.createUser
  )
  .get(
    auth('get_staff'),
    validate(userValidation.getUsers),
    userController.getUsers
  );

router
  .route('/:userId')
  .get(
    auth('get_staff'),
    validate(userValidation.getUser),
    userController.getUser
  )
  .patch(
    auth('manage_staff'),
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    auth('manage_staff'),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

export default router;

/**
 * @openapi
 * /v1/user:
 *   post:
 *     summary: Add a staff member to the logged-in user's shop (OWNER only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Suzuki
 *               email:
 *                 type: string
 *                 example: suzuki@urbantrim.com
 *               password:
 *                 type: string
 *                 description: At least 8 characters, with at least 1 letter and 1 number
 *                 example: Password123
 *               role:
 *                 type: string
 *                 enum: [OWNER, MANAGER, ASSISTANT, RECEPTIONIST, STAFF]
 *                 example: STAFF
 *     responses:
 *       201:
 *         description: Returns the created user
 *       400:
 *         description: Validation error or email already taken
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden (needs the manage_staff permission)
 *   get:
 *     summary: List the staff of the logged-in user's shop (OWNER only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by exact name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [OWNER, MANAGER, ASSISTANT, RECEPTIONIST, STAFF]
 *         description: Filter by role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by, ascending (e.g. name, createdAt)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Users per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number, starting at 0
 *     responses:
 *       200:
 *         description: Array of users (without passwords)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden (needs the get_staff permission)
 */

/**
 * @openapi
 * /v1/user/{userId}:
 *   get:
 *     summary: Get one staff member of the logged-in user's shop (OWNER only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the user (without password)
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden (needs the get_staff permission)
 *       404:
 *         description: User not found (or belongs to another shop)
 *   patch:
 *     summary: Update a staff member (OWNER only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Send at least one field
 *             properties:
 *               name:
 *                 type: string
 *                 example: Suzuki Ichiro
 *               email:
 *                 type: string
 *                 example: suzuki.new@urbantrim.com
 *               password:
 *                 type: string
 *                 description: At least 8 characters, with at least 1 letter and 1 number
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Returns the updated user (id, name, email, role)
 *       400:
 *         description: Validation error, empty body, or email already taken
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden (needs the manage_staff permission)
 *       404:
 *         description: User not found (or belongs to another shop)
 *   delete:
 *     summary: Delete a staff member (OWNER only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted (no content)
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden (needs the manage_staff permission)
 *       404:
 *         description: User not found (or belongs to another shop)
 */