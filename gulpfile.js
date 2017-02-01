'use strict'

const gulp = require('gulp')
const premailer = require('gulp-premailer')
const shell = require('gulp-shell')
const spawn = require('child_process').spawn

// Load tasks
require('gulp-task-loader')('tasks')

// Docs
gulp.task('docs', shell.task([
  './node_modules/.bin/jsdoc -r -c conf.json .'
]))

// Premailer
gulp.task('emails', function () {
  return gulp.src('./emails/**/*.html')
    .pipe(premailer())
    .pipe(gulp.dest('./build/emails'))
})

// Build
gulp.task('build', ['emails'])

// Default task (watchers)
gulp.task('watch', function () {
  gulp.watch(['**/*.js', '!./node_modules/**'], ['test'])
})

/*
 * Docs task
 */
gulp.task('docs', function (done) {
  let params = 'docs/events/main.md -o EVENTS.md'

  params = params.split(' ')

  return spawn('hercule', params, {
    stdio: 'inherit'
  })
    .on('exit', function (error) {
      if (!error) {
        console.log('Success!')
      }
      return done()
    })
})

gulp.task('docsw', function () {
  gulp.watch(['**/*.js', '!./node_modules/**'], ['docs'])
})
