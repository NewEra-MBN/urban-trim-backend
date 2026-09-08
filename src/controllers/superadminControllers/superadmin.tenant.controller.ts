import catchAsync from "../../utils/catchAsync.js"
import httStatus from 'http-status'
import tenantUserServices from "../../services/tenant&user.services.js"
import pick from "../../utils/pick.js"
import { Role } from "../../../generated/prisma/enums.js"
import exclude from "../../utils/exclude.js"

const listAllTenants = catchAsync(async (req, res) => {
    const options = pick(req.query, ['sortBy','limit','page']) as {
        page?: string,
        limit?:string,
        sortBy?:string
    }
    const tenants = await tenantUserServices.queryTenants(
        {},
        options,
        ["id","email","name"]
    )

    res.send(tenants)
})  


const getTenant = catchAsync(async(req, res) => {
    const id = req.params.id as string;
    const tenant = await tenantUserServices.getTenantById(id)
    res.send(tenant)
}) 


const createTenant = catchAsync(async(req, res) => {
    const {tenantName,name, email, password} = req.body;
    const tenant = await(tenantUserServices.createTenant(tenantName, email));
    const owner = await  (tenantUserServices.createUser(name, email, password, Role.OWNER, tenant.id))
    const safeOwner = exclude(owner, ['password'])
    res.send({...tenant, ...safeOwner})
})

const updateTenantById = catchAsync(async(req, res) => {
    const id = req.params.id as string;
    const tenant = await tenantUserServices.updateTenantById(id, req.body)
    res.send(tenant)
})

const suspendTenantById = catchAsync(async(req, res) => {
    const id = req.params.id as string;
    const suspendedTenant = await tenantUserServices.suspendTenantById(id);
    res.send(suspendedTenant)
})


const deleteTenant = catchAsync(async(req,res) => {
    const id = req.params.id as string;
    await tenantUserServices.deleteTenantById(id)
    res.status(httStatus.NO_CONTENT).send()
})

export default {
    listAllTenants,
    getTenant,
    createTenant,
    updateTenantById,
    deleteTenant
}