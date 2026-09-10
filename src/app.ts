import express from 'express'
import cors from 'cors'
import passport from 'passport'
import authRoutes from './routes/v1/user.auth.routes.js'
import userRoutes from './routes/v1/user.routes.js'
import { jwtStrategy } from './config/strategies/user.strategy.js'
import { errorConverter, errorHandler } from './middlewares/error.js'

const app = express();
app.use(cors())
app.use(express.json())

app.use(passport.initialize());
passport.use('jwt', jwtStrategy)

app.use('/api/hello', (req, res) => res.send('hello I am listening'))
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

app.use(errorConverter)
app.use(errorHandler)

export default app
