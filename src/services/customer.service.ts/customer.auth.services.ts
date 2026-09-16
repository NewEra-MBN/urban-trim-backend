import prisma from "../../client.js";
import httpStatus from 'http-status';
import generateSixDigitCode from "../../utils/otpGenerator.js";
import { encryptPassword, isPasswordMatch } from "../../utils/encryption.js";
import { OwnerType, TokenType } from "../../../generated/prisma/enums.js";
import moment from "moment";
import tokenService from "../token.service.js";
import { ApiError } from "../../utils/ApiError.js";
import emailService from "../email.service.js";


const requestOtp =  async(email: string, customerId: string) => {
    const code = generateSixDigitCode();
    const hashedCode = await encryptPassword(code);
    const expires = moment().add('5', "minutes")

    await tokenService.saveToken(hashedCode, expires, TokenType.OTP, OwnerType.CUSTOMER, customerId);

    await emailService.sendVerficationCode(email, code)
}


const verifyOtp  = async(code: string, tenantId: string, email: string) => {
    const customer = await prisma.customer.findUnique({
        where: {tenantId_email: {tenantId, email}}
    })

    if(!customer) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Customer not found')
    }

    const tokens = await prisma.token.findMany({
        where: {type: TokenType.OTP, ownerType: OwnerType.CUSTOMER, ownerId: customer.id, blacklisted: false}
    })

    const isMatched = await Promise.any(
        tokens.map(async (t) => await isPasswordMatch(code, t.token) ? t : Promise.reject())
    ).catch(()=> null)



    if(!isMatched || isMatched.expires < new Date()) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token')
    }


    await prisma.token.deleteMany({
        where:{type: TokenType.OTP, ownerId: customer.id}
    })

    const authTokens = await tokenService.generateAuthTokens(OwnerType.CUSTOMER, customer.id, customer.tenantId)

    return {customer, authTokens}

}

export default {
    requestOtp,
    verifyOtp
}