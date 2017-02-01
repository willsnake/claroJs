'use strict'

const gulp = require('gulp')
const mocha = require('gulp-mocha')
const argv = require('yargs').argv

// Test
module.exports = function () {
  let params = {
    reporter: argv.reporter || 'spec',
    require: ['co-mocha'],
    timeout: 20000
  }
  argv.ui && (params.ui = argv.ui)
  argv.grep && (params.grep = argv.grep)
  argv.timeout && (params.timeout = argv.timeout)
  return gulp.src('test/**/*.js', { read: false })
    .pipe(mocha(params))
}
