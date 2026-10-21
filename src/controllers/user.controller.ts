import tenantUserServices from "../services/tenant&user.services.js";
import catchAsync from "../utils/catchAsync.js";
import httpStatus from 'http-status'
import pick from "../utils/pick.js";
import { ApiError } from "../utils/ApiError.js";
import exclude from "../utils/exclude.js";
import { encryptPassword } from "../utils/encryption.js";

const createUser = catchAsync(async (req, res) => {
    const { email, password, name, role } = req.body;
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "No tenant associated with this account");
    }
    const user = await tenantUserServices.createUser(name, email, password, role, tenantId);
    const safeUser = exclude(user, ['password'])
    res.status(httpStatus.CREATED).send(safeUser)
})


const getUsers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'role']);
    const tenantId = req.user?.tenantId as string;
    const options = pick(req.query, ["sortBy", "limit", "page"]) as {
        page?: string;
        limit?: string;
        sortBy?: string;
    };
    const result = await tenantUserServices.queryUsers(filter, options, tenantId)

    res.send(result)
})


const getUser = catchAsync(async (req, res) => {

    const { userId } = req.params;

    if (typeof userId !== "string") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
    };

    const user = await tenantUserServices.getUserById(userId, req.user?.tenantId as string);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    res.send(user)
})

const updateUser = catchAsync(async (req, res) => {
    const tenantId = req.user!.tenantId as string;
    const userId = req.params.userId as string;
    

    const updateBody = {...req.body};
    if(updateBody.password) {
        updateBody.password = await encryptPassword(updateBody.password);
    }

    const user = await tenantUserServices.updateUserById(tenantId, userId, updateBody);
    res.send(user);
});



const deleteUser = catchAsync(async (req, res) => {
    const tenantId = req.user!.tenantId as string;
    const userId = req.params.userId as string;
    await tenantUserServices.deleteUserById(userId, tenantId);
    res.status(httpStatus.NO_CONTENT).send();
});


const uploadPhoto = catchAsync(async(req, res) => {
    const tenantId = req.user!.tenantId as string;
    const userId = req.params.userId as string;

    if(!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, "photo file is required")
    };

    const user = await tenantUserServices.updateUserPhoto(tenantId, userId, req.file);

    res.send(exclude(user, ['password']))
})



export default {
    createUser,
    getUser,
    getUsers,
    updateUser,
    deleteUser,
    uploadPhoto
}
