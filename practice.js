// const user = {
//     name:"Kamal",
//     age: 22
// }

// const tokenData = "shami"


// console.log({
//     ...user,
//     ...(tokenData && { tokenData })
// })






import crypto from 'crypto';

const generateSixDigitCode = () => {
    const otp = crypto.randomInt(100000, 1000000).toString();
    return otp;
}


const otpCode = generateSixDigitCode();

console.log(otpCode)