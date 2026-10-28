import prisma from "../src/client.js";
import { Role } from "../generated/prisma/enums.js";
import { encryptPassword } from "../src/utils/encryption.js";

const TENANT_COUNT = 5;
const CUSTOMER_PER_TENANT = 50;
const STAFF_PER_TENANT = 4;
const SERVICE_TEMPLATES = [
    {name: "Cut", price: 3000, durationMinutes: 30},
    {name: "Color", price: 6000, durationMinutes: 60},
    {name: "Perm", price: 8000, durationMinutes: 90}
]


async function seedBooking() {
    // clean the db....

    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();


    const tenants = [];
    for(let i = 1; i <= TENANT_COUNT; i++) {
        const tenant = await prisma.tenant.create({
            data: {
                name: `Salon${i}`,
                email: `salon${i}@seed.test`
            }
        });

        tenants.push(tenant);
    }

    console.log(`Created ${tenants.length} tenants`)

// staff list

    const staffList = [];
    const password = await encryptPassword('password1')
    for(const tenant of tenants) {
        for(let i = 1; i <= STAFF_PER_TENANT; i++) {
            const staff = await prisma.user.create({
                data: {
                    name: `${tenant.name}-staff${i}`,
                    email:`${tenant.name}-staff${i}@seed.test`,
                    password,
                    tenantId: tenant.id,
                    role: Role.STAFF
                }
            })
            
            staffList.push(staff)
        }
    }


    console.log(`Created ${staffList.length} staff`)

    const services = [];
    for(const tenant of tenants) {
        for(const template of SERVICE_TEMPLATES) {
            const service = await prisma.service.create({
                data:{
                    name: template.name,
                    price: template.price,
                    durationMinutes: template.durationMinutes,
                    tenantId: tenant.id
                }
            })
            services.push(service)
        }
    }


    console.log(`Created ${services.length} services`);


    const customers = [];
    
    for(const tenant of tenants) {
        for(let i = 1; i <= CUSTOMER_PER_TENANT; i++) {
            const customer =  await prisma.customer.create({
                data: {
                    name:`${tenant.name}c${i}`,
                    phone:`9000-2349-${String(i).padStart(4, "0")}`,
                    email:`c${i}@seed.test`,
                    tenantId: tenant.id
                }
            })
            customers.push(customer);
        }
    }

    console.log(`Created ${customers.length} customers`)

}


seedBooking()
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());

