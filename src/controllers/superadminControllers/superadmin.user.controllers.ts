import tenantUserServices from "../../services/tenant&user.services.js";
import catchAsync from "../../utils/catchAsync.js";
import pick from "../../utils/pick.js";
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
   res.send(users)
})




const getUser  = catchAsync(async(req, res) => {
    const userId = req.params.userId as string;
    const user = await tenantUserServices.getAnyUserById(userId)
    res.send(user)
})  



const updateUser = catchAsync(async(req, res) => {
    const userId = req.params.userId as string;
    const user = await tenantUserServices.updateAnyUserById(userId, req.body)
    res.send(user)
})



const deleteUser = catchAsync(async(req, res) => {
    const userId = req.params.userId as string;
    await tenantUserServices.deleteAnyUserById(userId)
    res.send(httStatus.NO_CONTENT).send()
})

export default {
    listAllUsersByTenant,
    getUser,
    updateUser,
    deleteUser
}