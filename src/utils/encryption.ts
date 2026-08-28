import bcrypt from 'bcrypt'
export const encryptPassword = async(password : string) => {
    const encryptPassword =  await bcrypt.hash(password, 12);
    return encryptPassword
}


export const isPasswordMatch = async (password: string, userPassword: string) => {
    return bcrypt.compare(password, userPassword)
}