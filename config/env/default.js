'use strict'

module.exports = {
  port: process.env.PORT || 3000,
  mongo: {
    port: process.env.MONGO_PORT_27017_TCP_PORT || 27017,
    host: process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost',
    db: process.env.MONGO_PORT_27017_TCP_DATABASE || 'clarodrive',
    user: process.env.MONGO_PORT_27017_TCP_USER || '',
    password: process.env.MONGO_PORT_27017_TCP_PASSWORD || ''
  }
}
