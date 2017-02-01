'use strict'

const queue = require('../lib/queue')
const Taxonomy = require('../../models/taxonomy')

/**
 * Create or update categories
 *
 * @event taxonomy.sync
 */
queue.pull('taxonomy.sync', function * (queue) {
  let taxonomy = yield Taxonomy.findOne({
    _id: queue.data.model._id
  })

  if (taxonomy) {
    yield Taxonomy.update({
      _id: queue.data.model._id
    }, {
      $set: queue.data.model
    })
  } else {
    yield Taxonomy.create(queue.data.model)
  }
})
