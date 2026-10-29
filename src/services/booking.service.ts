import prisma from '../client.js'

const getBookings = async({tenantId, page, limit}: {tenantId: string, page: number, limit: number}) => {
    const skip = (page - 1)*limit;

    const bookings = await prisma.booking.findMany({
        where: {
            tenantId
        },
        skip,
        take: limit,
        orderBy: {startAt: 'asc'}
    })
    return bookings;
};

export default {
    getBookings
};



