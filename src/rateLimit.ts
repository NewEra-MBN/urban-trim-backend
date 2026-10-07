import rateLimit from "express-rate-limit";

const globalRateLimiter =  rateLimit({
    windowMs:15 * 60 * 1000,
    max: 100,
    message: "Too many requests, Please try again later"
});


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 7,
    message: "Too many login Attempts, try again later"
})


export default {
    globalRateLimiter,
    loginLimiter
}