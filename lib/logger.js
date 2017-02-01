'use strict'

const config = require('../config/env')
const winston = require('winston')
const env = process.env.NODE_ENV || 'development'
const Slack = require('slack-winston').Slack

/** Test Logger */
winston.loggers.add('test', {
  console: {
    level: 'debug',
    colorize: true,
    prettyPrint: true
  }
})

/** Development Logger */
winston.loggers.add('development', {
  console: {
    level: 'debug',
    colorize: true,
    prettyPrint: true
  }
})

/** Production Logger */
winston.loggers.add('production', {
  console: {
    level: 'info',
    prettyPrint: true
  },
  transports: [
    /** Add Slack Transport */
    new Slack(config.winston.transports.slack)
  ]
})

module.exports = winston.loggers.get(env)
