import { ApiError } from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";
import pick from "../utils/pick.js";
import tenantUserServices from "../services/tenant&user.services.js";
import httStatus from 'http-status'


const getTenant = catchAsync(async (req, res) => {
    const { tenantId } = req.params
    if (typeof tenantId !== "string") {
        throw new ApiError(httStatus.BAD_REQUEST, 'invalid user Id')
    }
    const tenant = await tenantUserServices.getTenantById(tenantId);
    if (!tenant) {
        throw new ApiError(httStatus.NOT_FOUND, 'Tenant Not Found')
    }
})


const updateTenant = catchAsync(async (req, res) => {
    const { tenantId } = req.params;
    if (typeof tenantId !== 'string') {
        throw new ApiError(httStatus.BAD_REQUEST, 'invalid tenant id')
    }

    const tenant = await tenantUserServices.updateTenantById(tenantId, req.body)
})

const deleteTenant = catchAsync(async (req, res) => {
    const { tenantId } = req.params;
    if (typeof tenantId !== 'string') {
        throw new ApiError(httStatus.BAD_REQUEST, 'invalid tenant id')
    }

    await tenantUserServices.deleteTenantById(tenantId)
})