import { PrismaClient } from '../generated/prisma/client.js';
import config from './config/config.js';
import { PrismaPg } from '@prisma/adapter-pg';
// add prisma to the NodeJS global type

const globalForPrisma = globalThis as unknown as {
    prisma : PrismaClient | undefined
}


const prisma = 
    globalForPrisma.prisma ?? new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
    })


    if(config.env === 'development') {
        globalForPrisma.prisma = prisma
    }

export default prisma