import nodemailer from 'nodemailer'
import config from '../config/config.js'
//import logger 

const transport = nodemailer.createTransport(config.email.smtp);

if(config.env !== 'test') {
    transport
        .verify()
        .then(() => console.log('connected to email server'))
        .catch(() => console.log('failed to connect email serverr'))
}


const sendMail = async(to: string, subject: string, text: string) => {
    const msg = { from: config.email.from, to, subject, text }
    await transport.sendMail(msg)
}   



const sendResetPasswordEmail = async(to : string, token : string) => {
    const subject = 'Reset Password';
    const resetPasswordUrl = `http://localhost:5000/reset-password?token=${token}`;
    const text = `Dear User
        To reset your password please click on the link ${resetPasswordUrl}
        If you did not request any password reset please ignore the email.
    `;
    await sendMail(to, subject, text)
}


const sendVerificationEmail = async(to: string, token : string) => {
    const subject = 'verify Email';
    const verifyEmailUrl = `http://link-to-app/verify-email?token=${token}`;
    const text = `Dear User
        for verifying the email please click on the link ${verifyEmailUrl}
    `
    await sendMail(to, subject, text);
}

export default {
    sendResetPasswordEmail,
    sendVerificationEmail
}