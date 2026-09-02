import { SuperAdmin } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";
import prisma from "../client.js";
import { ApiError } from "../utils/ApiError.js";
import httpStatus from 'http-status'

const getSuperAdminById = async <Key extends keyof SuperAdmin>(
    id: string,
    keys: Key[] = [
        "id",
        "email",
        "createdAt",
        "updatedAt"
    ] as Key[]
): Promise<Pick<SuperAdmin, Key> | null> => {
    return prisma.superAdmin.findUnique({
        where: { id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<SuperAdmin, Key> | null>;
};


const getSuperAdminByEmail = async <Key extends keyof SuperAdmin>(
    email: string,
    keys: Key[] = [
        "id",
        "email",
        "createdAt",
        "updatedAt"
    ] as Key[]
): Promise<Pick<SuperAdmin, Key> | null> => {
    return prisma.superAdmin.findUnique({
        where: { email },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<SuperAdmin, Key> | null>;
};

const updateSuperAdminById = async <Key extends keyof SuperAdmin>(
    superAdminId: string,
    updateBody: Prisma.SuperAdminUpdateInput,
    keys: Key[] = ["id", "email",] as Key[]
): Promise<Pick<SuperAdmin, Key> | null> => {
    const superAdmin = await getSuperAdminById(superAdminId);
    if (!superAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, "superAdmin not found");
    }

    if (updateBody.email && (await getSuperAdminByEmail(updateBody.email as string))) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    return prisma.superAdmin.update({
        where: { id: superAdminId },
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as unknown as Promise<Pick<SuperAdmin, Key> | null>;
};