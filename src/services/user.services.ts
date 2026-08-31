import { Tenant, User, Role, Prisma } from "../../generated/prisma/client.js";
import httpStatus from "http-status";
import prisma from "../client.js";
import { ApiError } from "../utils/ApiError.js";
import { encryptPassword } from "../utils/encryption.js";

// ─────────────────────────────
// Tenant
// ─────────────────────────────

const createTenant = async (name: string): Promise<Tenant> => {
    return prisma.tenant.create({
        data: { name }
    });
};

const getTenantById = async <Key extends keyof Tenant>(
    id: number,
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

const updateTenantById = async <Key extends keyof Tenant>(
    tenantId: number,
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

const deleteTenantById = async (tenantId: number): Promise<Tenant> => {
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
    tenantId: number
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
    id: number,
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
        where: { id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<User, Key> | null>;
};

// email is globally unique on User, so no tenantId needed to look it up
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
    tenantId: number,
    userId: number,
    updateBody: Prisma.UserUpdateInput,
    keys: Key[] = ["id", "name", "email", "role"] as Key[]
): Promise<Pick<User, Key> | null> => {
    const user = await getUserById(userId);
    if (!user || user.tenantId !== tenantId) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    return prisma.user.update({
        where: { id: userId },
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as unknown as Promise<Pick<User, Key> | null>;
};

const deleteUserById = async (userId: number, tenantId: number): Promise<User> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    await prisma.user.delete({ where: { id: user.id } });
    return user;
};

export default {
    createTenant,
    getTenantById,
    updateTenantById,
    deleteTenantById,
    createUser,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById
};