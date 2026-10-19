import express from 'express'
import cors from 'cors'
import passport from 'passport'

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';
import { userJwtStrategy } from './config/strategies/user.strategy.js';
import { superAdminJwtStrategy } from './config/strategies/superadmin.strategy.js';
import { customerJwtStrategy } from './config/strategies/customer.strategy.js';
import { errorConverter, errorHandler } from './middlewares/error.js';
import routes from './routes/v1/index.js';
import helmet from 'helmet';
import rateLimit from './rateLimit.js';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';



const app = express();
app.use(pinoHttp({
    logger,
    serializers:{
        req: (req) => ({id: req.id, method: req.method, url: req.url}),
        res: (res) => ({statusCode: res.statusCode})
    }
}));
app.use(helmet());
app.use(rateLimit.globalRateLimiter)

app.use(cors())
app.use(express.json())

app.use(passport.initialize());
passport.use('jwt-user', userJwtStrategy)
passport.use('jwt-superadmin', superAdminJwtStrategy)
passport.use('jwt-customer', customerJwtStrategy)

app.use('/v1', routes)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/hello', (req, res) => res.send('hello how are you'))

app.use(errorConverter)
app.use(errorHandler)

export default app
