import crypto from 'crypto';

const generateSixDigitCode = () => {
    const otp = crypto.randomInt(100000, 1000000).toString();
    return otp;
}


export default generateSixDigitCode;