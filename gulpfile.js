'use strict';
//region Require
var gulp = require('gulp');
var gulpif = require('gulp-if');
var del = require('del');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var minimist = require('minimist');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var ngAnnotate = require('gulp-ng-annotate');
var merge = require('merge-stream');
var runSequence = require('run-sequence');
//endregion

// region Config
var config = require('./gulpconfig.json');
var paths = config.paths;

var knownOptions = {
    string: 'env',
    default: {env: config.env.default}
};

var options = minimist(process.argv.slice(2), knownOptions);
var env = config.env[options.env];
//endregion

// region Tasks
gulp.task('default', function (done) {
    runSequence('clean', 'scripts', done);
});

gulp.task('clean', cleanTask);
gulp.task('jshint', jsHintTask);
gulp.task('scripts', scriptsTask);
//endregion

// region Helper functions
function swallowError(error) {
    console.log(error.toString());
    this.emit('end');
}
//endregion

// region Function declarations
/**
 * cleanTask
 */
function cleanTask() {
    del.sync(['./build']);
}

/**
 * Check JS with jshint
 */
function jsHintTask() {
    return gulp.src(paths.src + '/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
}

/**
 * Generate sourcemaps and output to build
 * Minify if specified in current environment
 */
function scriptsTask() {
    var sources = [
        paths.src + '/module.js',
        paths.src + '/**/*.js'
    ];

    var sourcesOptions = {base: paths.src};
    var concatFileName = 'cf.feedback.min.js';

    return gulp.src(sources, sourcesOptions)
        .pipe(gulpif(env.sourcemaps, sourcemaps.init({gulpWarnings: false})))
        .pipe(ngAnnotate({gulpWarnings: false}))
        .on('error', swallowError)
        .pipe(gulpif(env.jsconcat, concat(concatFileName)))
        .pipe(gulpif(env.jsminify, uglify()))
        .pipe(gulpif(env.sourcemaps, sourcemaps.write()))
        .pipe(gulp.dest(paths.dist));
}



