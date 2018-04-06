var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var babelify = require('babelify');
var vinylSource = require('vinyl-source-stream');
var vinylBuffer = require('vinyl-buffer');
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');
 
var distFolder = 'dist/';
 
gulp.task('js', function () {
    return browserify({entries: './browserify-entry.js', debug: true})
        .ignore([
            './node_modules/lightbox/assets/templates/lightbox.handlebars',
            './node_modules/lightbox/assets/templates/closebutton.handlebars'
        ])
        .on('error', function (err) {
            console.error(err);
            this.emit('end');
         })
        .transform(babelify, {presets: ['env']})
        .bundle()
        .on('error', function (err) {
            console.error(err);
            this.emit('end');
         })
        .pipe(vinylSource('deps.js'))
        .pipe(vinylBuffer())
        .pipe(sourcemaps.init())
    //    .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(distFolder));
});

gulp.task('angular', function () {
    return gulp.src(['app/module/wellnessroom.js', 'app/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('concat.js'))
        .pipe(rename('wellnessroom.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
});

gulp.task('admin', function () {
    return gulp.src(['app/module/admin.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('concat.js'))
        .pipe(rename('admin.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
});

gulp.task('email', function () {
    return gulp.src('./email-templates/emails.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./email-templates/'));
});

gulp.task('build', ['js', 'angular', 'admin', 'email']);

gulp.task('server', ['build'], function () {
    var stream = nodemon({
        script: 'index.js',
        tasks: ['build'],
        ignore: ['dist/', 'email-templates/emails.css'],
        ext: 'js css html pug json'
    });

    stream.on('error', function (err) {
        console.error(err);
    }).on('restart', function () {
        console.log('restarted!');
    }).on('crash', function() {
        console.error('Application has crashed!');
        setTimeout(function () {
            stream.emit('restart', 10);
        }, 5000);
    });

    return stream;
});
