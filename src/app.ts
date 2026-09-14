import express from 'express'
import cors from 'cors'
import passport from 'passport'

import { userJwtStrategy } from './config/strategies/user.strategy.js'
import { superAdminJwtStrategy } from './config/strategies/superadmin.strategy.js'
import { errorConverter, errorHandler } from './middlewares/error.js'
import routes from './routes/v1/index.js'
import superadminAuthController from './controllers/superadminControllers/superadmin.auth.controller.js'

const app = express();
app.use(cors())
app.use(express.json())

app.use(passport.initialize());
passport.use('jwt-user', userJwtStrategy)
passport.use('jwt-superadmin', superAdminJwtStrategy)

app.use('/v1', routes)

app.use(errorConverter)
app.use(errorHandler)

export default app
