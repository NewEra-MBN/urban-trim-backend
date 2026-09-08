import tenantUserServices from "../../services/tenant&user.services.js";
import catchAsync from "../../utils/catchAsync.js";
import pick from "../../utils/pick.js";
import exclude from "../../utils/exclude.js";
import { arrayBuffer } from "node:stream/consumers";
import httStatus from 'http-status'

const listAllUsersByTenant = catchAsync(async(req,res) => {
   const filter = pick(req.query, ['role','name']);
   const options = pick(req.query, ["sortBy", "limit", "page"]) as {
        page?: string;
        limit?: string;
        sortBy?: string;
    };
   const tenantId = req.params.tenantId as string;
   const users = await tenantUserServices.queryUsers(filter, options, tenantId)
   return users;
})




const getUser  = catchAsync(async(req, res) => {
    const userId = req.params.userId as string;
    const user = await tenantUserServices.getAnyUserById(userId)
    res.send(user)
})  



const updateUser = catchAsync(async(req, res) => {
    const userId = req.params.id as string;
    const user = await tenantUserServices.updateAnyUserById(userId, req.body)
    res.send(user)
})



const deleteUser = catchAsync(async(req, res) => {
    const userId = req.params.id as string;
    const user = await tenantUserServices.deleteAnyUserById(userId)
    res.send(httStatus.NO_CONTENT).send()
})

export default {
    listAllUsersByTenant,
    getUser,
    updateUser,
    deleteUser
}