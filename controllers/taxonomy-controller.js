// This is used only for testing the deep populate library on mongoose, it can be deletede anytime
'use strict'

const Taxonomy = require('../models/taxonomy')

let controller = {}

/**
 * Get all the elements from the taxonomy model
 * @param {Function} next
 */
controller.getAll = function *(next) {

  this.body = {}
  this.status = 200
  yield next
}

module.exports = controller
