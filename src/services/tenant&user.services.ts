import { Tenant, User, Role, Prisma } from "../../generated/prisma/client.js";
import httpStatus from "http-status";
import prisma from "../client.js";
import { ApiError } from "../utils/ApiError.js";
import { encryptPassword } from "../utils/encryption.js";
import { skip } from "@prisma/client/runtime/client";

// ─────────────────────────────
// Tenant
// ─────────────────────────────

const createTenant = async (name: string, email: string): Promise<Tenant> => {
    return prisma.tenant.create({
        data: { name, email }
    });
};

const getTenantById = async <Key extends keyof Tenant>(
    id: string,
    keys: Key[] = [
        "id",
        "name",
        "createdAt",
        "updatedAt"
    ] as Key[]
): Promise<Pick<Tenant, Key> | null> => {
    return prisma.tenant.findUnique({
        where: { id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<Tenant, Key> | null>;
};



// query tenant
const queryTenants = async <Key extends keyof Tenant>(
    filter: object,
    options: {
        page?:string;
        limit?: string;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    },
    keys:Key[]
):Promise<Pick<Tenant, Key>[]> =>{
    const page = options.page ?? 0;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy;
    const sortType = options.sortType ?? 'asc';

    const tenants = await prisma.tenant.findMany({
        where: filter,
        select: keys.reduce((obj,k) => ({...obj, [k] : true}),{}),
        skip: Number(page) * Number(limit),
        take: Number(limit),
        orderBy: sortBy ? {[sortBy] : sortType} : undefined
    })
    return tenants as Pick<Tenant,Key>[];
}



const updateTenantById = async <Key extends keyof Tenant>(
    tenantId: string,
    updateBody: Prisma.TenantUpdateInput,
    keys: Key[] = ["id", "name"] as Key[]
): Promise<Pick<Tenant, Key> | null> => {
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Tenant not found");
    }

    return prisma.tenant.update({
        where: { id: tenant.id },
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as unknown as Promise<Pick<Tenant, Key> | null>;
};




const suspendTenantById = async(id: string): Promise<Tenant> => {
    const tenant = await prisma.tenant.findUnique({
        where: {id: id}
    })
    if (!tenant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Tenant not found");
    }

    return prisma.tenant.update({
        where: {id: tenant.id},
        data: {
            suspended: true
        }
    })
}

const deleteTenantById = async (tenantId: string): Promise<Tenant> => {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Tenant not found");
    }

    await prisma.tenant.delete({ where: { id: tenant.id } });
    return tenant;
};



// ─────────────────────────────
// User (Owner / Manager / Assistant / Receptionist / Staff)
// ─────────────────────────────



const createUser = async (
    name: string,
    email: string,
    password: string,
    role: Role = Role.STAFF,
    tenantId: string
): Promise<User> => {
    if (await getUserByEmail(email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }
    return prisma.user.create({
        data: {
            name,
            email,
            password: await encryptPassword(password),
            role,
            tenantId
        }
    });
};

const getUserById = async <Key extends keyof User>(
    userId: string,
    tenantId: string,
    keys: Key[] = [
        "id",
        "email",
        "name",
        "role",
        "tenantId",
        "isEmailVerified",
        "createdAt",
        "updatedAt"
    ] as Key[]
): Promise<Pick<User, Key> | null> => {
    return prisma.user.findUnique({
        where: { id: userId, tenantId: tenantId },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<User, Key> | null>;
};


const getAnyUserById = async <Key extends keyof User>(
    userId: string,
    keys: Key[] = [
        "id",
        "email",
        "name",
        "role",
        "tenantId",
        "isEmailVerified",
        "createdAt",
        "updatedAt",
    ] as Key[]
): Promise<Pick<User, Key> | null> => {
    return prisma.user.findUnique({
        where: { id: userId},
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<User, Key> | null>;
};


// query Users
const queryUsers = async <Key extends keyof User>(
    filter: object,
    options: {
        page?:string;
        limit?: string;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    },
    tenantId: string,
    keys:Key[] = [
        "id",
        "email",
        "name",
        "role",
        "tenantId",
        "isEmailVerified",
        "createdAt",
        "updatedAt"
    ]as Key[]
):Promise<Pick<User, Key>[]> =>{
    const page = options.page ?? 0;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy;
    const sortType = options.sortType ?? 'asc';

    const users = await prisma.user.findMany({
        where: {
            ...filter,
            tenantId: tenantId 
        },
        select: keys.reduce((obj,k) => ({...obj, [k] : true}),{}),
        skip: Number(page) * Number(limit),
        take: Number(limit),
        orderBy: sortBy ? {[sortBy] : sortType} : undefined
    })
    return users as Pick<User, Key>[]
}


const getUserByEmail = async <Key extends keyof User>(
    email: string,
    keys: Key[] = [
        "id",
        "email",
        "name",
        "password",
        "role",
        "tenantId",
        "isEmailVerified",
        "createdAt",
        "updatedAt"
    ] as Key[]
): Promise<Pick<User, Key> | null> => {
    return prisma.user.findUnique({
        where: { email },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<User, Key> | null>;
};



const updateUserById = async <Key extends keyof User>(
    tenantId: string,
    userId: string,
    updateBody: Prisma.UserUpdateInput,
    keys: Key[] = ["id", "name", "email", "role"] as Key[]
): Promise<Pick<User, Key> | null> => {
    const user = await getUserById(userId, tenantId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    return prisma.user.update({
        where: { id: userId, tenantId },
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as unknown as Promise<Pick<User, Key> | null>;
};

const updateAnyUserById = async <Key extends keyof User>(
    userId: string,
    updateBody: Prisma.UserUpdateInput,
    keys: Key[] = ["id", "name", "email", "role"] as Key[]
): Promise<Pick<User, Key> | null> => {
    const user = await getAnyUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    return prisma.user.update({
        where: { id: userId},
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as unknown as Promise<Pick<User, Key> | null>;
};

const deleteUserById = async (userId: string, tenantId: string): Promise<User> => {
    console.log('here is the user Id',userId)
    const user = await prisma.user.findUnique(
        {
             where: { id: userId, tenantId } 
        }
    );
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    await prisma.user.delete({ where: { id: user.id } });
    return user;
};

const deleteAnyUserById = async (userId: string): Promise<User> => {
    console.log('here is the user Id',userId)
    const user = await prisma.user.findUnique(
        {
             where: { id: userId } 
        }
    );
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    await prisma.user.delete({ where: { id: user.id } });
    return user;
};

export default {
    createTenant,
    getTenantById,
    queryTenants,
    updateTenantById,
    deleteTenantById,
    createUser,
    getUserById,
    getAnyUserById,
    queryUsers,
    getUserByEmail,
    updateUserById,
    updateAnyUserById,
    deleteAnyUserById,
    deleteUserById,
    suspendTenantById
};