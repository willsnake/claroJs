// This is used only for testing the deep populate library on mongoose, it can be deletede anytime
'use strict'

const taxonomy = require('../controllers/taxonomy-controller')
const Router = require('koa-router')
// const joi = require('joi')

// We configure the router to have the prefix of the user controller
let router = new Router({
  prefix: '/taxonomy'
})

/** Get current user instead collection */
router.get('/', taxonomy.getAll)

module.exports = router
