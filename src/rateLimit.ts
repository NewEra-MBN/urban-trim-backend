import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// each limiter has its own counter, so one route can't use up another route's tries
const createLimiter = (limit: number, message: string) => rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { statusCode: 429, message }
});

// every route: stops one IP from flooding the whole API
const globalRateLimiter = createLimiter(100, "Too many requests, please try again later");

// user + super admin login: slows down password guessing
const loginLimiter = createLimiter(7, "Too many login attempts, please try again later");

// booking request: each one emails a code, so cap it to stop email spam
const otpSendLimiter = createLimiter(5, "Too many booking requests, please try again later");

// booking confirm: without this, a 6-digit code can be guessed by brute force
const otpVerifyLimiter = createLimiter(5, "Too many code attempts, please try again later");


export default {
    globalRateLimiter,
    loginLimiter,
    otpSendLimiter,
    otpVerifyLimiter
}
