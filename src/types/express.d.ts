import type { User as PrismaUser, SuperAdmin as PrismaSuperAdmin, Customer as PrismaCustomer } from "../../generated/prisma/client.ts";

declare global {
    namespace Express {
        // req.user can be a regular User or a SuperAdmin depending on which passport strategy authenticated the request
        interface User extends PrismaUser, Partial<PrismaSuperAdmin> {}
        interface Request {
            superAdmin?: PrismaSuperAdmin;
            customer?: PrismaCustomer;
        }
    }
}


export{};