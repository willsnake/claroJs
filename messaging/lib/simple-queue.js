'use strict'

const assert = require('assert')
const Bull = require('bull')
const debug = require('../../lib/debug')
const co = require('co')
const joi = require('joi')
const EventEmitter = require('events')
const _ = require('lodash')

class Queue extends EventEmitter {
  constructor (options) {
    super()

    options = options || {}

    this.redis = options.redis || {}
    this.redis.port = this.redis.port || 6379
    this.redis.host = this.redis.host || '127.0.0.1'
    this.redis.options = this.redis.options || {}
    this.prefix = options.prefix || ''

    this.queues = {}
  }

  pull (queueName, callback, redis) {
    assert(queueName, 'should be specified a queue name')
    assert.equal(typeof callback, 'function', 'should be specified a handler function')
    assert.equal(callback.constructor.name, 'GeneratorFunction', 'should be specified a generator handler')

    let queuePrefixedName = this.prefix ? `${this.prefix}:${queueName}` : queueName

    let queue = this.get(queuePrefixedName, redis)

    if (!queue.handler) {
      let ctx = this

      queue.process((queue, done) => {
        co(function * () {
          return yield callback.call(ctx, queue)
        })
        .then(function (result) {
          done(null, result || null)
          debug.messaging.info(queue.data, `message processed from queue "${queueName}"`)
        })
        .catch(function (error) {
          done(error)
          debug.messaging.error(error, queue.data, `message failed from queue "${queueName}"`)
        })
      })
    }

    return queue
  }

  push (queueName, message, redis) {
    assert(queueName, 'should be specified a queue name')
    assert.equal(typeof queueName, 'string', 'should be specified a queue name as string')
    message = message || {}

    if (message.prefix) {
      queueName = `${message.prefix}:${queueName}`
    }

    let queue = this.get(queueName, redis)
    queue.add(message)

    debug.messaging.info(message, 'message pushed to queue %s', queueName)

    return queue
  }

  get (queueName, redis) {
    redis = _.defaultsDeep(redis, {
      port: this.redis.port,
      host: this.redis.host,
      options: this.redis.options
    })

    assert(queueName, 'should be specified a queue name')
    assert.equal(typeof queueName, 'string', 'should be specified a queue name as string')

    return Bull(queueName, redis.port, redis.host, redis.options)
  }

  validate (data, schema) {
    assert(data, 'should be specified an object to validate')
    assert.equal(typeof data, 'object', 'should be specified an object to validate')
    assert(schema, 'should be specified a schema to validate')
    assert.equal(typeof schema, 'object', 'should be specified a schema to validate')

    return new Promise((resolve, reject) => {
      joi.validate(data, schema, function (err, value) {
        if (err) return reject(err)
        resolve(value)
      })
    })
  }
}

module.exports = Queue
