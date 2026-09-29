import config from './config/config.js'
import app from './app.js'

app.listen(config.port, ()=> {
    console.log(`Server running on port 5000 http://localhost:5000`)
})