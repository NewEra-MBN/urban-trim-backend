import express from 'express'
import cors from 'cors'
import authRoutes from './routes/v1/auth.routes.js'
import userRoutes from './routes/v1/user.routes.js'
import passport from 'passport'
import { jwtStrategy } from './config/passport.js'

const app = express();
app.use(cors())
app.use(express.json())
 
console.log('req hitted')

//jwtauthentication 
app.use(passport.initialize());
passport.use('jwt', jwtStrategy)

app.use('/api/hello', (req, res) => res.send('hello I am listening'))
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

app.listen(5000, ()=> {
    console.log(`Server running on port 5000 http://localhost:5000`)
})