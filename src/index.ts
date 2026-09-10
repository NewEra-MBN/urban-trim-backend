import express from 'express'
import cors from 'cors'
import authRoutes from './routes/v1/user.auth.routes.js'
import userRoutes from './routes/v1/user.routes.js'
import passport from 'passport'
import { userJwtStrategy } from './config/strategies/user.strategy.js'
import { superAdminJwtStrategy } from './config/strategies/superadmin.strategy.js';
import routes from './routes/v1/index.js'


const app = express();
app.use(cors())
app.use(express.json())
 
console.log('req hitted')

//jwtauthentication 
app.use(passport.initialize());
passport.use('jwt-user', userJwtStrategy)
passport.use('jwt-superadmin',superAdminJwtStrategy)


app.use('/v1', routes)

app.listen(5000, ()=> {
    console.log(`Server running on port 5000 http://localhost:5000`)
})