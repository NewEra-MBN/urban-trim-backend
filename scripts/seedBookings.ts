import prisma from "../src/client.js";
import { Role, Status } from "../generated/prisma/enums.js";
import { encryptPassword } from "../src/utils/encryption.js";

const TENANT_COUNT = 5;
const CUSTOMER_PER_TENANT = 50;
const STAFF_PER_TENANT = 4;
const SERVICE_TEMPLATES = [
    {name: "Cut", price: 3000, durationMinutes: 30},
    {name: "Color", price: 6000, durationMinutes: 60},
    {name: "Perm", price: 8000, durationMinutes: 90}
];
const BOOKING_PER_STAFFS = 500;


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

// every tenant got 50 customers
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

    console.log(`Created ${customers.length} customers`);
    const bookingData = [];
    for(const tenant of tenants) {
        const tenantServices = services.filter(s => s.tenantId === tenant.id);
        const tenantCustomers = customers.filter(c => c.tenantId  === tenant.id);
        const tenantStaff = staffList.filter(s => s.tenantId === tenant.id);

         
        
        for(const staff of tenantStaff){
            let cursor = new Date("2026-11-01T09:00:00Z");

            for(let i = 0; i < BOOKING_PER_STAFFS; i++) {
                const service = tenantServices[i % tenantServices.length];
                const customer = tenantCustomers[i % tenantCustomers.length]
                const startAt = cursor;
                const endAt = new Date(startAt.getTime() + service.durationMinutes * 60 * 1000)
                cursor = endAt;
               bookingData.push({ startAt, endAt, status: Status.CONFIRMED, tenantId: tenant.id,
                   serviceId: service.id, customerId: customer.id, staffId: staff.id });
            }
        }
    }
    const result = await prisma.booking.createMany({data: bookingData});
    console.log(`Created ${result.count} bookings`)
}


seedBooking()
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());

