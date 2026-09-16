// const user = {
//     name:"Kamal",
//     age: 22
// }

// const tokenData = "shami"


// console.log({
//     ...user,
//     ...(tokenData && { tokenData })
// })






// import crypto from 'crypto';

// const generateSixDigitCode = () => {
//     const otp = crypto.randomInt(100000, 1000000).toString();
//     return otp;
// }


// const otpCode = generateSixDigitCode();

// console.log(otpCode)




// /*promise - any*/

// const array = [1, 2, 3, 4]

// const promises = array.map(n =>
//     n > 5
//         ? Promise.resolve(`Ok: ${n}`)
//         :Promise.reject(`Fail: ${n}`)
// )


// Promise.any(promises)
//     .then(console.log)
//     .catch(console.log)



// function getUser(officeName, body){
//     console.log(officeName)
//     console.log(body)
// }


// getUser('HirCut', {name: 'kamal', age: 23, position: 'manager'})




let userName = {name: 'kamal', age: 22}

let newUser = {name: 'tamim', age: 21, position: 'admin'}



userName = {...newUser}
console.log(userName)