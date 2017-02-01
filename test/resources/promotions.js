'use strict'

const faker = require('faker')
const promotions = require('./promotions.json')
const Promotion = require('../../models/promotion')
const Order = require('../../models/order')
const User = require('../../models/user')
const utils = require('../lib/utils')
const config = require('../../config/env')
const verify = require('jsonwebtoken').verify
const ensure = require('certainty').ensure

describe('Promotions /promotions', function () {
  before(function* () {
    this.agent = global.test.agent
    for (let p of promotions) {
      // We add the products available to the promotion
      for (let condition of p.condition) {
        if (condition.property === 'products') {
          condition.value = global.test.fixtures.products.map(function (product) {
            return product._id
          })
        }
      }

      for (let condition of p.condition) {
        if (condition.property === 'customers') {
          condition.value = global.test.fixtures.users.map(function (user) {
            return user.coreId
          })
        }
      }
      let promotion = yield Promotion.findOneAndUpdate({
        code: p.code
      }, p, {
        upsert: true,
        new: true
      })
      global.test.fixtures.promotions.push(promotion)
    }
  })

  it('should create an order with a coreId from Kamaji', function* () {
    let token = yield this.agent.post('/users/visitor')
    this.token = token.body.token
    let order = yield this.agent.post('/orders')
      .set('Authorization', `Bearer ${this.token}`)
      .send({
        items: [{
          'product': global.test.fixtures.products[0]._id,
          'quantity': 10
        }],
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email(),
        addressLine1: faker.address.streetName() + ' ' + faker.random.number().toString(),
        street: faker.address.streetName(),
        number: faker.random.number().toString(),
        suiteNumber: faker.random.number().toString(),
        postalCode: faker.address.zipCode(),
        locality: faker.random.word(),
        municipality: faker.random.words(),
        settlement: faker.random.word(),
        state: faker.address.state(),
        country: faker.address.country(),
        recipient: faker.name.firstName() + ' ' + faker.name.lastName()
      })
    this.order = order.body

    yield utils.sleep(3000)

    let orderCreated = yield Order.findOneAndUpdate({
      _id: this.order._id
    }, {
      coreId: '55241c55fa8d5c150d193000'
    }, {
      new: true
    })
    orderCreated = orderCreated.toObject()
    ensure(orderCreated.coreId).named('Order Core ID').isNotUndefined()
    ensure(orderCreated.coreId).named('Order Core ID').isNotNull()
    this.order = orderCreated
  })

  it('should create new card for the user', function* () {
    let res = yield this.agent.post('/cards')
      .set('Authorization', `Bearer ${this.token}`)
      .send({
        name: 'Jose Luis',
        number: '5105105105105100',
        month: '03',
        year: '17',
        cvv: '123',
        token: '1234567890',
        primary: true
      })
      .expect(201)
    ensure(res.body._id).named('Card ID').isNotNull()
    ensure(res.body._id).named('Card ID').isNotUndefined()
    this.card = res.body
  })

  it('should add the user to the promotion', function* () {
    var decoded = verify(this.token, config.jwt.secret)

    let promotions = yield Promotion.find({})
    for (let p of promotions) {
      // We add the products available to the promotion
      for (let condition of p.condition) {
        if (condition.property === 'customers') {
          condition.value.push(decoded.profile.coreId)
          let update = yield Promotion.findOneAndUpdate({
            _id: p._id
          }, p)
          ensure(update).isNotEmpty()
        }
      }
    }
  })

  it('should not validate a promocode that it is not in the database', function* () {
    let res = yield this.agent.post('/promotions')
      .set('Authorization', `Bearer ${this.token}`)
      .send({
        order_id: this.order.order_id,
        promoCode: faker.random.alphaNumeric()
      })
      .expect(409)
    ensure(res.body.code).named('Error Code').isEqualTo(2701)
  })

  it('should apply the promocode to the order', function* () {
    let res = yield this.agent.post('/promotions')
      .set('Authorization', `Bearer ${this.token}`)
      .send({
        order_id: this.order.order_id,
        promoCode: global.test.fixtures.promotions[0].code
      })
      .expect(201)

    ensure(res.body.total).named('Total Price').isNotEqualTo(this.order.total)
    ensure(res.body.discount).named('Discount').isNotEqualTo(0)
    ensure(res.body.discount).named('Discount').isNotNullOrUndefined()
    this.discount = res.body.discount
    this.total = this.order.total
  })

  it('should NOT apply the same promocode more than once to the same user', function* () {
    let order = yield Order.findOne({
      _id: this.order._id
    }).populate('promoCode')
    ensure(order.promoCode.code).named('Promo Code').isEqualTo(global.test.fixtures.promotions[0].code)
  })

  it('should add a product to the user order', function* () {
    let order = yield this.agent.post('/orders')
      .set('Authorization', `Bearer ${this.token}`)
      .send({
        items: [{
          'product': global.test.fixtures.products[1]._id,
          'quantity': 1
        }],
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email(),
        addressLine1: faker.address.streetName() + ' ' + faker.random.number().toString(),
        street: faker.address.streetName(),
        number: faker.random.number().toString(),
        suiteNumber: faker.random.number().toString(),
        postalCode: faker.address.zipCode(),
        locality: faker.random.word(),
        municipality: faker.random.words(),
        settlement: faker.random.word(),
        state: faker.address.state(),
        country: faker.address.country(),
        recipient: faker.name.firstName() + ' ' + faker.name.lastName()
      })
    ensure(order.body.items).hasLength(2)
    this.orderToCompare = order.body
  })

  it('should have updated the discount value with the same promoCode', function* () {
    ensure(this.orderToCompare.total).named('Total Price').isNotEqualTo(this.total)
    ensure(this.orderToCompare.discount).named('Discount').isNotEqualTo(this.discount)
    ensure(this.orderToCompare.discount).named('Discount').isNotNullOrUndefined()
  })

  it('should reference the promocode on the order', function* () {
    let res = yield Order.findOne({
      order_id: this.order.order_id
    }).populate('promoCode')
    ensure(res.promoCode).isNotEmpty()
    ensure(res.promoCode.code).named('PromoCode Code').isEqualTo(global.test.fixtures.promotions[0].code)
  })

  it('should make a payment', function* () {
    let res = yield this.agent.post('/payments')
      .set('Authorization', `Bearer ${this.token}`)
      .send({
        orderId: this.order._id,
        cardId: this.card._id,
        paymentMethod: 'card'
      })
      .expect(201)
    this.payment = res.body
  })

  it('should create a new order with a coreId from Kamaji', function* () {
    let token = yield this.agent.post('/users/visitor')
    this.newToken = token.body.token
    let order = yield this.agent.post('/orders')
      .set('Authorization', `Bearer ${this.newToken}`)
      .send({
        items: [{
          'product': global.test.fixtures.products[0]._id,
          'quantity': 80
        }],
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email(),
        addressLine1: faker.address.streetName() + ' ' + faker.random.number().toString(),
        street: faker.address.streetName(),
        number: faker.random.number().toString(),
        suiteNumber: faker.random.number().toString(),
        postalCode: faker.address.zipCode(),
        locality: faker.random.word(),
        municipality: faker.random.words(),
        settlement: faker.random.word(),
        state: faker.address.state(),
        country: faker.address.country(),
        recipient: faker.name.firstName() + ' ' + faker.name.lastName()
      })
    this.newOrder = order.body

    yield utils.sleep(3000)

    let orderCreated = yield Order.findOneAndUpdate({
      _id: this.newOrder._id
    }, {
      coreId: '55241c55fa8d5c150d193000'
    }, {
      new: true
    })
    orderCreated = orderCreated.toObject()
    ensure(orderCreated.coreId).named('Order Core ID').isNotUndefined()
    ensure(orderCreated.coreId).named('Order Core ID').isNotNull()
    this.newOrder = orderCreated
  })

  it('should NOT validate a promocode if it does not pass the conditions', function* () {
    var decoded = verify(this.newToken, config.jwt.secret)
    yield User.findOneAndUpdate({
      _id: decoded.profile._id
    }, {
      coreId: '55241c55fa8d5c150d193000'
    })
    let res = yield this.agent.post('/promotions')
      .set('Authorization', `Bearer ${this.newToken}`)
      .send({
        order_id: this.newOrder.order_id,
        promoCode: global.test.fixtures.promotions[0].code
      })
      .expect(409)
    ensure(res.body.code).named('Error Code').isEqualTo(2705)
  })

  it('should create a new order with a coreId from Kamaji', function* () {
    let token = yield this.agent.post('/users/visitor')
    this.secondNewToken = token.body.token
    let order = yield this.agent.post('/orders')
      .set('Authorization', `Bearer ${this.secondNewToken}`)
      .send({
        items: [{
          'product': global.test.fixtures.products[0]._id,
          'quantity': 80
        }],
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email(),
        addressLine1: faker.address.streetName() + ' ' + faker.random.number().toString(),
        street: faker.address.streetName(),
        number: faker.random.number().toString(),
        suiteNumber: faker.random.number().toString(),
        postalCode: faker.address.zipCode(),
        locality: faker.random.word(),
        municipality: faker.random.words(),
        settlement: faker.random.word(),
        state: faker.address.state(),
        country: faker.address.country(),
        recipient: faker.name.firstName() + ' ' + faker.name.lastName()
      })
    this.secondNewOrder = order.body

    yield utils.sleep(3000)

    let orderCreated = yield Order.findOneAndUpdate({
      _id: this.secondNewOrder._id
    }, {
      coreId: '55241c55fa8d5c150d193000'
    }, {
      new: true
    })
    orderCreated = orderCreated.toObject()
    ensure(orderCreated.coreId).named('Order Core ID').isNotUndefined()
    ensure(orderCreated.coreId).named('Order Core ID').isNotNull()
    this.secondNewOrder = orderCreated
  })

  it('should add the user to the new promotion', function* () {
    var decoded = verify(this.secondNewToken, config.jwt.secret)
    let newUser = yield User.findOneAndUpdate({
      _id: decoded.profile._id
    }, {
      coreId: '55241c55fa8d5c150d193000'
    }, {
      new: true
    })

    let promotions = yield Promotion.find({})
    for (let p of promotions) {
      // We add the products available to the promotion
      for (let condition of p.condition) {
        if (condition.property === 'customers') {
          condition.value.push(newUser.coreId)
          let update = yield Promotion.findOneAndUpdate({
            _id: p._id
          }, p)
          ensure(update).isNotEmpty()
        }
      }
    }
  })

  it('should discount the shipping cost by percentage', function* () {
    let res = yield this.agent.post('/promotions')
      .set('Authorization', `Bearer ${this.secondNewToken}`)
      .send({
        order_id: this.secondNewOrder.order_id,
        promoCode: global.test.fixtures.promotions[1].code
      })
      .expect(201)
    ensure(res.body.total).named('Total Price').isNotEqualTo(this.secondNewOrder.total)
    ensure(res.body.shippingCost).named('Shipping Cost').isEqualTo(0)
    ensure(res.body.discount).named('Discount').isNotEqualTo(0)
    ensure(res.body.discount).named('Discount').isNotNullOrUndefined()
  })
})
