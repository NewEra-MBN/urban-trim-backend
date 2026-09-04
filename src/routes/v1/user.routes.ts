import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import userValidation from "../../validations/user.validation.js";
import userController from "../../controllers/user.controller.js";
import { Router } from "express";

const router = Router();

router
    .route('/')
    .post(auth('manage_staff'),validate(userValidation.createUser), userController.createUser)
    .get(auth('get_staff'),validate(userValidation.getUser), userController.getUsers)


router
    .route('/:userId')
    .get(auth('get_staff'), validate(userValidation.getUser), userController.getUser)
    .patch(auth('manage_staff'), validate(userValidation.updateUser), userController.updateUser)
    .delete(auth('manage_staff'), validate(userValidation.deleteUser), userController.deleteUser)

    export default router