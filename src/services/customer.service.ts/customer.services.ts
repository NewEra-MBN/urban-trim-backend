import { Status } from "../../../generated/prisma/enums.js"
import prisma from "../../client.js"
import customerAuthServices from "./customer.auth.services.js";
const createBookingRequest = async(tenantId: string, body: {
    name: string,
    phone: string,
    email: string,
    serviceId: number,
    date: Date
}) => {
    let customer = await prisma.customer.findUnique({
        where: {tenantId_email: {tenantId, email: body.email}}
    })

    if(!customer){
       customer = await prisma.customer.create({
            data: {
                tenantId: tenantId,
                name: body.name,
                phone: body.phone,
                email: body.email
            }
        })
    }else if (customer.name !== body.name || customer.phone !== body.phone) {
        await prisma.customer.update({
            where: {id: customer.id},
            data: {name: body.name, phone: body.phone}
        })
    }

    const booking = await prisma.booking.create({
        data: {
            tenantId,
            serviceId: body.serviceId,
            customerId: customer.id,
            date: body.date,
            status: Status.PENDING
        }
    });
    
    await customerAuthServices.requestOtp(body.email, customer.id)

    return {bookingId: booking.id}
}

const confirmBooking = async(tenantId:string, bookingId: number, email: string, code: string) => {

    const {customer, authTokens} = await customerAuthServices.verifyOtp(code, tenantId, email);

    const booking = await prisma.booking.update({
        where:{id: bookingId, tenantId: customer.tenantId, customerId: customer.id},
        data: {status: Status.CONFIRMED}
    })

    return {booking, authTokens}
}

export default {
    createBookingRequest,
    confirmBooking
}