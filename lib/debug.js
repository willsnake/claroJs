'use strict'

const debug = require('debug')

/** Services to debug */
let services = [
  'com',
  'database',
  'http',
  'kamaji',
  'messaging'
]

/** Set default debuggers */
let debuggers = debug('papi')
debuggers.error = debug('papi:error')
debuggers.info = debug('papi:info')

/** Set debuggers of services */
for (let service of services) {
  debuggers[service] = debug(service)
  debuggers[service].error = debug(`${service}:error`)
  debuggers[service].info = debug(`${service}:info`)
}

module.exports = debuggers
