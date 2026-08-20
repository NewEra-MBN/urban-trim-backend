import { Tenant, Staff, Role, Prisma } from "../../generated/prisma/client.js";
import type { TenantUpdateInput } from "../../generated/prisma/models/Tenant.js";
import httpStatus from "http-status";
import prisma from "../client.js";
import { ApiError } from "../utils/ApiError.js";
import { encryptPassword } from "../utils/encryption.js";
import type { StaffUpdateInput } from "../../generated/prisma/models.js";


//creating the Tenant

const createTenant = async (
    name: string,
    email: string,
    password: string
): Promise<Tenant> => {
    if (await getTenantByEmail(email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    return prisma.tenant.create({
        data: {
            email,
            name,
            password: await encryptPassword(password),
        }
    });
};


// create staff 

const createStaff = async (
    name: string,
    email: string,
    role: Role = Role.STAFF,
    tenantId: number
): Promise<Staff> => {
    if (await getStaffByEmail(tenantId, email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    return prisma.staff.create({
        data: {
            email,
            name,
            role,
            tenantId
        }
    });
};


// query for the tenant 
const getTenantById = async <Key extends keyof Tenant>(
    id: number,
    keys: Key[] = [
        'id',
        'email',
        'name',
        'password',
        'isEmailVerified',
        'createdAt',
        'updatedAt'
    ] as Key[]
): Promise<Pick<Tenant, Key> | null> => {
    return prisma.tenant.findUnique({
        where: { id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<Tenant, Key> | null>;
};

const getTenantByEmail = async <Key extends keyof Tenant>(
    email: string,
    keys: Key[] = [
        'id',
        'email',
        'name',
        'password',
        'isEmailVerified',
        'createdAt',
        'updatedAt'
    ] as Key[]
): Promise<Pick<Tenant, Key> | null> => {
    return prisma.tenant.findUnique({
        where: { email },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<Tenant, Key> | null>;
};



// query for the  staff
const getStaffById = async <Key extends keyof Staff>(
    tenantId: number,
    id: number,
    keys: Key[] = [
        'id',
        'email',
        'name',
        'role',
        'createdAt',
        'updatedAt'
    ] as Key[]
): Promise<Pick<Staff, Key> | null> => {
    return prisma.staff.findUnique({
        where: { tenantId, id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<Staff, Key> | null>;
};



const getStaffByEmail = async<Key extends keyof Staff>(
    tenantId: number,
    email: string,
    keys: Key[] = [
        'id',
        'email',
        'name',
        'role',
        'createdAt',
        'updatedAt'
    ] as Key[]
):Promise<Pick<Staff, Key> | null> => {
    return prisma.staff.findUnique({
        where:{tenantId,email},
        select: keys.reduce((obj, k) =>({...obj, [k] : true}),{})
    }) as Promise<Pick<Staff, Key> | null>
}


/*
    update  
    tenant and staff
    by Id
*/


const updateTenantById = async <Key extends keyof Tenant>(
    tenantId: number,
    updateBody: TenantUpdateInput,
    keys: Key[] = ['id','name','email'] as Key[]
): Promise<Pick<Tenant, Key> | null> =>{
    const tenant = await getTenantById(tenantId)
    if(!tenant) {
        throw new ApiError(httpStatus.NOT_FOUND, 'tenant not found')
    }

    if(updateBody.email && (await getTenantByEmail(updateBody.email as string))){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
    }

    const updateTenant =await prisma.tenant.update({
        where: {id: tenant.id},
        data: updateBody,
        select: keys.reduce((obj, k) => ({...obj, [k] : true}),{})
    })

    return updateTenant as Promise<Pick<Tenant, Key> | null>
}


// update staff by Id 


const updateStaffById = async <Key extends keyof Staff>(
    tenantId: number,
    staffId: number,
    updateBody: StaffUpdateInput,
    keys: Key[] = ['id','name','email'] as Key[]
): Promise<Pick<Staff, Key> | null> =>{
    const staff = await getStaffById(tenantId, staffId)
    if(!staff) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found')
    }

    if(updateBody.email && (await getStaffByEmail(tenantId, updateBody.email as string))){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
    }

    const updateStaff =await prisma.staff.update({
        where: {id: staffId, tenantId},
        data: updateBody,
        select: keys.reduce((obj, k) => ({...obj, [k] : true}),{})
    })

    return updateStaff as Promise<Pick<Staff, Key> | null>
}



/// delete tenant && staff ...

const deleteTenantById = async (tenantId: number): Promise<Tenant> => {
    const tenant = await prisma.tenant.findUnique({
        where: {id: tenantId}
    })

    if(!tenant){
        throw new ApiError(httpStatus.NOT_FOUND, 'Tenant not found')
    }

    await prisma.tenant.delete({where: {id: tenant.id}})
    return tenant;
};


const deleteStaffById = async (staffId: number, tenantId: number): Promise<Staff> => {
    const staff = await prisma.staff.findUnique({
        where: {id: staffId, tenantId}
    })

    if(!staff){
        throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found')
    }

    await prisma.staff.delete({where: {id: staff.id, tenantId}})
    return staff;
};