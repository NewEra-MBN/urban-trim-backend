import { Status } from "../../../generated/prisma/enums.js";
import prisma from "../../client.js";
import { ApiError } from "../../utils/ApiError.js";
import customerAuthServices from "./customer.auth.services.js";
import httpStatus from "http-status";

const createBookingRequest = async (
    tenantId: string,
    body: {
        name: string;
        phone: string;
        email: string;
        serviceId: number;
        date: Date;
    }
) => {
    let customer = await prisma.customer.findUnique({
        where: { tenantId_email: { tenantId, email: body.email } }
    });

    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                tenantId,
                name: body.name,
                phone: body.phone,
                email: body.email
            }
        });
        
    } else if (customer.name !== body.name || customer.phone !== body.phone) {
        await prisma.customer.update({
            where: { id: customer.id },
            data: { name: body.name, phone: body.phone }
        });
    }

    let booking = await prisma.booking.findFirst({
        where: {
            customerId: customer.id,
            status: Status.PENDING
        }
    });

    if (!booking) {
        booking = await prisma.booking.create({
            data: {
                tenantId,
                serviceId: body.serviceId,
                customerId: customer.id,
                date: body.date,
                status: Status.PENDING
            }
        });
    } else {
        booking = await prisma.booking.update({
            where: { id: booking.id },
            data: { serviceId: body.serviceId, date: body.date }
        });
    }

    await customerAuthServices.requestOtp(body.email, customer.id);

    return { bookingId: booking.id };
};

const confirmBooking = async (
    tenantId: string,
    bookingId: number,
    email: string,
    code: string
) => {
    const { customer, authTokens } = await customerAuthServices.verifyOtp(code, tenantId, email);

    const existing = await prisma.booking.findFirst({
        where: { id: bookingId, customerId: customer.id }
    });

    if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");

    const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: Status.CONFIRMED }
    });

    return { booking, authTokens };
};

const getMe = async (customerId: string) => {
    return prisma.customer.findUnique({
        where: { id: customerId }
    });
};

const updateMe = async (customerId: string, updateBody: { name?: string; email?: string }) => {
    return prisma.customer.update({
        where: { id: customerId },
        data: updateBody
    });
};

const getBookings = async (customerId: string) => {
    const result = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { bookings: true }
    });

    return result?.bookings ?? [];
};

const cancelBooking = async (bookingId: number, customerId: string) => {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, customerId }
    });

    if (!booking) throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: Status.CANCELLED }
    });
};

const rescheduleBooking = async (
    bookingId: number,
    customerId: string,
    updateBody: { date: Date }
) => {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, customerId }
    });

    if (!booking) throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");

    return prisma.booking.update({
        where: { id: bookingId },
        data: updateBody
    });
};

export default {
    createBookingRequest,
    confirmBooking,
    getMe,
    updateMe,
    getBookings,
    cancelBooking,
    rescheduleBooking
};