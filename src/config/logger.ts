import config from "./config.js";
import pino from "pino";

const isProduction = config.env === 'production';


export const logger = pino({
    base: {
        env: config.env,
        version: '1.0.0'
    },

    // hide secrets before any log line is written
    redact: [
        'req.headers.authorization',
        '*.password',
        '*.code',
        '*.refreshToken'
    ],

    transport: isProduction
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname'
                    }
                },
    
    level: config.env === 'test' ? 'silent' : config.log_level
})


export type Logger = typeof logger;