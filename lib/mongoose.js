'use strict'

const config = require('../config/env').mongo
const debug = require('./debug')
const mongoose = require('mongoose')
mongoose.Promise = Promise

/** Set mongo URL */
config.url = `mongodb://${config.host}:${config.port}/${config.db}`

/** Set mongo options */
let options = {}
config.user && (options.user = config.user)
config.password && (options.password = config.password)

/** Connect to mongo service */
mongoose.connect(config.url, options)

/** Events */
mongoose.connection.on('error', debug.database.error)
mongoose.connection.once('open', function () {
  debug.database.info(`Mongo connected to ${config.url}`)
})

module.exports = mongoose
