import type { User as PrismaUser } from "../../generated/prisma/client.ts";

declare global {
    namespace Express {
        interface User extends PrismaUser {}
    }
}


export{};