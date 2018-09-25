const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync');
const autoprefixer = require('autoprefixer');
const minimist = require('minimist'); // 用來讀取指令轉成變數
const gulpSequence = require('gulp-sequence').use(gulp);

gulpSequence.use(gulp);
// production || development
// # gulp --env production
const envOptions = {
  string: 'env',
  default: { env: 'development' },
};

const options = minimist(process.argv.slice(2), envOptions);
console.log(options);

gulp.task('clean', () => {
  return gulp.src(['./public', './.tmp'], { read: false }).pipe($.clean());
});

gulp.task('vendorJs', () => {
  return gulp
    .src([
      './node_modules/jquery/dist/jquery.slim.min.js',
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
    ])
    .pipe($.concat('vendor.js'))
    .pipe(gulp.dest('./public/javascripts'));
});

gulp.task('sass', () => {
  // PostCSS AutoPrefixer
  const processors = [
    autoprefixer({
      browsers: ['last 5 version'],
    }),
  ];

  return gulp
    .src(['./source/stylesheets/**/*.sass', './source/stylesheets/**/*.scss'])
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe(
      $.sass({
        outputStyle: 'nested',
        includePaths: ['./node_modules/bootstrap/scss'],
      }).on('error', $.sass.logError),
    )
    .pipe($.postcss(processors))
    .pipe($.if(options.env === 'production', $.minifyCss())) // 假設開發環境則壓縮 CSS
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/stylesheets'))
    .pipe(
      browserSync.reload({
        stream: true,
      }),
    );
});

gulp.task('copy', () => {
  gulp
    .src(['./source/**/**', '!source/stylesheets/**/**', '!source/**/*.ejs', '!source/**/*.html'])
    .pipe(gulp.dest('./public/'))
    .pipe(
      browserSync.reload({
        stream: true,
      }),
    );
});

gulp.task('layout', () => {
  return gulp
    .src(['./source/**/*.ejs', './source/**/*.html'])
    .pipe($.plumber())
    .pipe($.frontMatter())
    .pipe(
      $.layout((file) => {
        return file.frontMatter;
      }),
    )
    .pipe(gulp.dest('./public'));
});

gulp.task('browserSync', () => {
  browserSync.init({
    server: { baseDir: './public' },
    reloadDebounce: 2000,
  });
});

gulp.task('watch', () => {
  gulp.watch(['./source/stylesheets/**/*.sass', './source/stylesheets/**/*.scss'], ['sass']);
  gulp.watch(['./source/**/**', '!/source/stylesheets/**/**'], ['copy']);
  gulp.watch(['./source/**/*.ejs', './source/**/*.html'], ['layout']);
});

gulp.task('deploy', () => {
  return gulp.src('./public/**/*').pipe($.ghPages());
});

gulp.task('sequence', gulpSequence('clean', 'copy', 'sass', 'vendorJs', 'layout', 'sass'));

gulp.task('default', ['copy', 'sass', 'vendorJs', 'browserSync', 'layout', 'watch']);
gulp.task('build', ['sequence']);
