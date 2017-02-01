'use strict'

const fs = require('fs')
const debug = require('../lib/debug')
const resolve = require('path').resolve

module.exports = function () {
  debug.messaging.info('Start message listeners...')

  let path = `${__dirname}/pulls`

  // Get pulls
  for (let file of fs.readdirSync(resolve(path))) {
    file = resolve(path, file)
    if (fs.statSync(file).isFile()) {
      try {
        require(file)
      } catch (e) {
        console.error(e)
      }
    }
  }
}
