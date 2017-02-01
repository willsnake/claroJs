'use strict'

const db = require('../lib/mongoose')
const co = require('co')
const mongoose = require('mongoose')
const Schema = require('mongoose').Schema

let schema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    default: 'category'
  },
  children: [{
    ref: 'Taxonomy',
    type: Schema.Types.ObjectId
  }],
  first: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: 'active'
  },
  media: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    width: Number,
    height: Number,
    url: {
      type: String,
      required: true
    },
    priority: {
      type: Number,
      default: 1
    },
    fileName: {
      type: String
    },
    imageId: {
      type: String
    }
  }],
  total: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

module.exports = db.model('Taxonomy', schema)
