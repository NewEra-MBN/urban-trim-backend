import tenantUserServices from "../services/tenant&user.services.js";
import catchAsync from "../utils/catchAsync.js";
import httpStatus from 'http-status'
import pick from "../utils/pick.js";
import { ApiError } from "../utils/ApiError.js";

const createUser = catchAsync(async (req, res) => {
    const { email, password, name, role, tenantId } = req.body;
    const user = await tenantUserServices.createUser(name, email, password, role, tenantId)
    res.status(httpStatus.CREATED).send(user)
})


const getUsers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ["sortBy", "limit", "page"]) as {
        page?: string;
        limit?: string;
        sortBy?: string;
    };
    const result = await tenantUserServices.queryUsers(filter, options)
})


const getUser = catchAsync(async (req, res) => {
    const { userId } = req.params;

    if (typeof userId !== "string") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
    };

    const user = await tenantUserServices.getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    res.send(user)
})

const updateUser = catchAsync(async (req, res) => {
    const tenantId = req.params.tenantId as string;
    const userId = req.params.userId as string;
    const user = await tenantUserServices.updateUserById(tenantId, userId, req.body);
    res.send(user);
});



const deleteUser = catchAsync(async (req, res) => {
    const tenantId = req.params.tenantId as string;
    const userId = req.params.userId as string;
    await tenantUserServices.deleteUserById(tenantId, userId);
    res.status(httpStatus.NO_CONTENT).send();
});



export default {
    createUser,
    getUser,
    getUsers,
    updateUser,
    deleteUser
}