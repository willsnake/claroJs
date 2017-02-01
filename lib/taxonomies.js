'use strict'

const debug = require('../lib/debug')
const Taxonomy = require('../models/taxonomy')

let taxonomies = {}

/**
 * This function populates the categories before inserting the data to elastic search
*/
taxonomies.populateCategory = function * (category, collection, first) {
  collection = collection || []
  first = first || category

  let found = yield Taxonomy.findOne({
    children: {
      $in: [category]
    }
  }, 'name')

  if (found) {
    debug.info('category found', found)
    collection.unshift(found)
    return yield taxonomies.populateCategory(found._id, collection, first)
  }

  collection.push(yield Taxonomy.findOne({
    _id: first
  }, 'name'))

  debug.info('collection finished', collection)

  return collection
}

/**
 * This function search the total of hits
*/
taxonomies.countTaxonomy = function (query, Product) {
  return new Promise((resolve, reject) => {
    Product.search(query, (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res.hits.total)
    })
  })
}

module.exports = taxonomies
