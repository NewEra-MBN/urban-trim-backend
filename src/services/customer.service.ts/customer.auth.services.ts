import prisma from "../../client.js"
import { ApiError } from "../../utils/ApiError.js"
import httpStatus from 'http-status'
import generateSixDigitCode from "../../utils/otpGenerator.js"
import { encryptPassword, isPasswordMatch } from "../../utils/encryption.js"
import tokenService from "../token.service.js"
import moment from "moment"
import { OwnerType, TokenType } from "../../../generated/prisma/enums.js"

const requestOtp = async(name: string, phone: string, tenantId: string, email: string) => {
    let customer = await prisma.customer.findUnique({
        where: {tenantId_phone: {tenantId, phone}}
    })

    if(!customer) {
        customer = await prisma.customer.create({
            data: {name, phone, email, tenantId}
        })
    }

    const otp = generateSixDigitCode();
    const hashedOTP = await encryptPassword(otp);
    const expires = moment().add(5, 'minutes')
    
    await tokenService.saveToken(hashedOTP, expires, TokenType.OTP, OwnerType.CUSTOMER, customer.id)
}



const verifyOtp = async(tenantId: string,  email : string,  otp: string) => {
    const customer = await prisma.customer.findUnique({
        where: {tenantId_email:{tenantId, email}}
    })
    if(!customer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found')
    }
    
    const otpToken = await prisma.token.findFirst({
        where:{type: TokenType.OTP, ownerId: customer.id, ownerType:OwnerType.CUSTOMER, blacklisted: false}
    })

    const matched = await isPasswordMatch(otpToken!.token, otp)

    if(!matched || otpToken!.expires < new Date()){
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expared code")
    }

    await prisma.token.deleteMany({where: {ownerId: customer.id, ownerType: OwnerType.CUSTOMER, type: TokenType.OTP}});
    
}
