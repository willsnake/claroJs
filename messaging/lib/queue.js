'use strict'

const Queue = require('./simple-queue')
const config = require('../../config/env')

const queue = new Queue({
  redis: {
    host: config.redis.host || '127.0.0.1',
    port: config.redis.port || 6379,
    options: {}
  }
})

module.exports = queue
