// Версия с подключением модулей ES Modules.
import gulp from 'gulp';
const { series, parallel, src, dest, task, watch } = gulp;
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);

import sourcemaps from  'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import postcssCustomMedia from 'postcss-custom-media';
import cssnano from 'cssnano';
import cleanCSS from 'gulp-clean-css';
import imagemin from 'gulp-imagemin';
import cache from 'gulp-cache';
import browser_Sync from 'browser-sync';
const browserSync = browser_Sync.create();

const files = {
  scssPath: ['assets/src/scss/*.scss','assets/src/scss/**/*.scss'],
  jsPath: ['assets/src/js/*.js', 'assets/src/js/*/*.js'],
  imagePath: ['assets/media/*.+(png|jpg|jpeg|gif|svg)', 'assets/media/*/*.+(png|jpg|jpeg|gif|svg)'],
  destCSS: 'assets/css',
  destJS: 'assets/js',
  destImage: 'assets/media',
}

function scssTask() {
  return src(files.scssPath)
    .pipe(sourcemaps.init())
    .pipe(sass(undefined, undefined).on('error', sass.logError))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(postcss([postcssCustomMedia(), autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(files.destCSS))
}

// Task 'gulp styles'
task( 'styles', function() {
  return scssTask();
});

// JS task: uglifies js files.
function jsTask() {
  return src(files.jsPath)
    .pipe(uglify())
    .pipe(dest(files.destJS))
}

// Task 'gulp scripts'
task( 'scripts', function() {
  return jsTask();
});

//
function imageminTask(){
  return src(files.imagePath)
    .pipe(cache(imagemin({
      interlaced: true
    })))
    .pipe(dest(files.destImage))
}

// Task 'gulp images'
task('images',  function() {
  return imageminTask();
});



const build = parallel(
  scssTask,
  jsTask,
  imageminTask,
);

task( 'build', function() {
  return build();
});

// Task 'gulp watch'
const watchTask = function () {
  watch(files.scssPath, scssTask).on('change', browserSync.reload);
  watch(files.jsPath, jsTask).on('change', browserSync.reload);
  watch(files.imagePath, { events: ['add', 'change'] }, imageminTask);
};
task( 'watch', function() {
  /* TODO
    Автосинхронизация браузера модулем browsersync
    https://www.drupal.org/project/browsersync
   browserSync.init({
    server: {
      baseDir: "./"
    }
  })*/
  return watchTask();
});
