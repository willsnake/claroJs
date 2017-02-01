'use strict'

/**
 * New code used to boot the configuration fo the server to the mocha tests
 */
const agent = require('supertest')
const server = require('../server')

before(function (done) {
  process.env.NODE_ENV = 'test'

  global.test = {
    server: server,
    agent: agent(process.env.TEST_URL || server.listen()),
    fixtures: {
      users: [],
      orders: [],
      cards: [],
      products: [],
      list: [],
      notifications: [],
      payments: [],
      hooks: [],
      promotions: [],
      media: []
    }
  }
  done()
})
