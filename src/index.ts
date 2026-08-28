import express from 'express'
import cors from 'cors'
import authRoutes from './routes/v1/auth.routes.js'

const app = express();
app.use(cors())
app.use(express.json())


app.use('/api/hello', (req, res) => res.send('hello I am listening'))
app.use('/api/auth', authRoutes)

app.listen(5000, ()=> {
    console.log(`Server running on port 5000 http://localhost:5000`)
})