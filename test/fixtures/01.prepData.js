'use strict'

const mongoose = require('mongoose')
const Taxonomy = require('../../models/taxonomy')
const taxonomies = require('./taxonomies.json')
const Product = require('../../models/product')
const products = require('./products.json')
const Brands = require('../../models/brand')
const brands = require('./brands.json')
const Address = require('../../models/address')
const Emails = require('../../models/emails')
const Payment = require('../../models/payment')
const UserData = require('../../models/userData')
const Shipment = require('../../models/shipment')
const Promotion = require('../../models/promotion')
const UsersPromotion = require('../../models/usersPromotion')
const Invoice = require('../../models/invoice')
const Media = require('../../models/media')
const media = require('./media.json')

// Create all taxonomies, brands, promotions and products
before(function * () {
  for (let t of taxonomies) {
    yield Taxonomy.create(t)
  }
  for (let b of brands) {
    yield Brands.create(b)
  }
  for (let p of products) {
    p._id = mongoose.Types.ObjectId(p._id)
    let product = yield Product.create(p)
    global.test.fixtures.products.push(product)
  }
  for (let m of media) {
    let mediaMock = yield Media.create(m)
    global.test.fixtures.media.push(mediaMock)
  }

  let cursor = Product.synchronize()
  let count = 0

  cursor.on('data', function (err, doc) {
    if (err) console.log('Error Data Synchronize', err)
    count++
  })
  cursor.on('close', function () {
    console.log('indexed ' + count + ' documents!')
  })
  cursor.on('error', function (err) {
    console.log('Error synchronize', err)
  })
})

// Delete all taxonomies, brands and products
after(function * () {
  yield Taxonomy.find({}, { multi: true }).remove()
  yield Brands.find({}, { multi: true }).remove()
  yield Product.find({}, { multi: true }).remove()
  yield Address.find({}, { multi: true }).remove()
  yield Emails.find({}, { multi: true }).remove()
  yield Payment.find({}, { multi: true }).remove()
  yield UserData.find({}, { multi: true }).remove()
  yield Shipment.find({}, { multi: true }).remove()
  yield Promotion.find({}, { multi: true }).remove()
  yield UsersPromotion.find({}, { multi: true }).remove()
  yield Invoice.find({}, { multi: true }).remove()
  yield Media.find({}, { multi: true }).remove()
  Product.esTruncate(function (err) {
    console.log('Error truncating', err)
  })
})
