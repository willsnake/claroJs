'use strict'

const logger = require('../lib/logger')
const winstonKoaLogger = require('winston-koa-logger')

require('colors')

module.exports = function () {
  return function * (next) {
    /** Add logger property to flow */
    this.logger = logger

    /** Log all request */
    yield winstonKoaLogger(this.logger).apply(this, arguments)

    /** Log query and body params if exist (except logs) */
    if (Object.keys(this.request.body).length && !/logs/.test(this.originalUrl)) {
      this.logger.debug('body params', JSON.parse(JSON.stringify(this.request.body)))
    }
    Object.keys(this.request.query).length && this.logger.debug('query params', this.request.query)

    yield next
  }
}
