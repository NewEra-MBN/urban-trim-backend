import prisma from "../client.js"

const getBookings = async({tenantId, page, limit} : {tenantId: string; page: number; limit: number}) => {

    const skip = (page - 1) * limit;

    const results = await prisma.booking.findMany({
        where: {tenantId},
        orderBy: [{startAt: "asc"}, {id: "asc"}],
        skip,
        take: limit
    })

    const total = await prisma.booking.count({where: {tenantId}})

    return {results, page, limit, total, totalPages: Math.ceil(total / limit)}
}

export default { getBookings };  