import config from "./config.js";
import pino from "pino";

const isProduction = config.env === 'production';


export const logger = pino({
    base: {
        env: config.env,
        version: '1.0.0'
    },

    transport: isProduction
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                        single: false,
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname'
                    }
                },
    
    level: config.log_level
})


export type Logger = typeof logger;