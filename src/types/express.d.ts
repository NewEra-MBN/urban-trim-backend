import type { Tenant } from "../../generated/prisma/client.ts";


declare global {
    namespace Express {
        interface User extends Tenant {}
    }
}


export{};