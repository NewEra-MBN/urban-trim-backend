import config from './config/config.js'
import app from './app.js'
import { logger } from './config/logger.js'

app.listen(config.port, ()=> {
    logger.info(`Server running on port 3000 http://localhost:${config.port}`)
})