import { Router } from "express";
import authSuperAdmin from "../../../middlewares/authSuperAdmin.js";
import validate from "../../../middlewares/validate.js";
import superadminUserControllers from "../../../controllers/superadminControllers/superadmin.user.controllers.js";
import superadminUserValidation from "../../../validations/superadmin.user.validation.js";
const router = Router();


router
    .route('/tenant/:tenantId')
    .get(authSuperAdmin,validate(superadminUserValidation.getAllUserByTenant), superadminUserControllers.listAllUsersByTenant);

    router
    .route('/:userId')
    .get(authSuperAdmin,validate(superadminUserValidation.getUserById), superadminUserControllers.getUser)
    .patch(authSuperAdmin,validate(superadminUserValidation.updateUserbyId),superadminUserControllers.updateUser)
    .delete(authSuperAdmin,validate(superadminUserValidation.deleteUserbyId), superadminUserControllers.deleteUser)

    export default router


    