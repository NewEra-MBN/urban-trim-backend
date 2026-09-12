import { Router } from "express";
import authSuperAdmin from "../../../middlewares/authSuperAdmin.js";
import validate from "../../../middlewares/validate.js";
import superadminTenantValidation from "../../../validations/superadmin.tenant.validation.js";
import superadminTenantController from "../../../controllers/superadminControllers/superadmin.tenant.controller.js";
const router = Router();

router 
    .route('/')
    .post(authSuperAdmin, validate(superadminTenantValidation.createTenant),superadminTenantController.createTenant)
    .get(authSuperAdmin, superadminTenantController.listAllTenants)

router
    .route('/:tenantId')
    .get(authSuperAdmin, superadminTenantController.getTenant)
    .patch(authSuperAdmin,validate(superadminTenantValidation.updateTenant), superadminTenantController.updateTenantById)
    .delete(authSuperAdmin, superadminTenantController.deleteTenant)

export default router