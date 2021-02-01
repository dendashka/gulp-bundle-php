let gulp = require('gulp'),
  sourcemaps = require('gulp-sourcemaps'),
  sass = require('gulp-sass'),
  browserSync = require('browser-sync'),
  uglify = require('gulp-uglifyjs'),
  source = require('vinyl-source-stream'),
  browserify = require('browserify'),
  babel = require('gulp-babel'),
  csso = require('gulp-csso'),
  rename = require('gulp-rename'),
  del = require('del'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  cache = require('gulp-cache'),
  gsmq = require('gulp-group-css-media-queries'),
  autoprefixer = require('gulp-autoprefixer');

let srcPath = 'app';
let distPath = 'dist';
let assetsPath = 'assets';

gulp.task('sass', function () {
  return gulp
    .src(`${srcPath}/${assetsPath}/scss/app.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(gsmq())
    .pipe(autoprefixer(['last 2 versions'], { cascade: true }))
    .pipe(csso())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${srcPath}/${assetsPath}/css`))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('scriptsBuild', function () {
  return browserify(`${srcPath}/${assetsPath}/js/app.js`)
    .bundle()
    .pipe(source('app.min.js'))
    .pipe(gulp.dest(`${srcPath}/${assetsPath}/js`));
});

gulp.task('scriptsMin', function () {
  return gulp
    .src([`${srcPath}/${assetsPath}/js/app.min.js`])
    .pipe(
      babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest(`${srcPath}/${assetsPath}/js`))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('browser-sync', function () {
  browserSync({
    // add neccesary url to proxy for live time dev
    proxy: "bundle.local/",
    notify: false,
    open: false,
    // tunnel: true,
  });
});

gulp.task('clean', async function () {
  return del.sync(`${distPath}`);
});

gulp.task('img', function () {
  return gulp
    .src(`${srcPath}/${assetsPath}/img/**/*`)
    .pipe(
      cache(
        imagemin({
          interlaced: true,
          progressive: true,
          use: [pngquant({
            quality: '70-90', // When used more then 70 the image wasn't saved
            speed: 1, // The lowest speed of optimization with the highest quality
            floyd: 1 // Controls level of dithering (0 = none, 1 = full).
        })],
        })
      )
    )
    .pipe(gulp.dest(`${distPath}/${assetsPath}/img`));
});

gulp.task('prebuild', async function () {
  let buildCss = gulp.src(`${srcPath}/${assetsPath}/css/*`).pipe(gulp.dest(`${distPath}/${assetsPath}/css`));

  let buildFonts = gulp.src(`${srcPath}/${assetsPath}/fonts/**/*`).pipe(gulp.dest(`${distPath}/${assetsPath}/fonts`));

  let buildJs = gulp.src(`${srcPath}/${assetsPath}/js/app.min.js`).pipe(gulp.dest(`${distPath}/${assetsPath}/js`));

  let buildStructure = gulp.src([`${srcPath}/**/*`, `!${srcPath}/${assetsPath}/**/*`]).pipe(gulp.dest(`${distPath}/`));
});

gulp.task('clear', function (callback) {
  return cache.clearAll();
});

gulp.task('checkupdate', function () {
  gulp.watch(`${srcPath}/${assetsPath}/scss/**/*.scss`, gulp.parallel('sass'));
  gulp.watch([`${srcPath}/${assetsPath}/js/app.js`, `${srcPath}/${assetsPath}/js/components/**/*.js`], gulp.series('scriptsBuild', 'scriptsMin'));
  gulp.watch(`${srcPath}/**/*.php`).on('change', browserSync.reload);
});
gulp.task(
  'watch',
  gulp.parallel(
    'sass',
    gulp.series(
      'scriptsBuild',
      'scriptsMin'
      ),
    'browser-sync',
    'checkupdate'
  )
);
gulp.task(
  'build',
  gulp.series(
    'clean',
    gulp.parallel(
      'img',
      'sass',
      gulp.series('scriptsBuild', 'scriptsMin')
    ),
    'prebuild'
  )
);
