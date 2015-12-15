'use strict';

var concat          = require('gulp-concat');
var gulp            = require('gulp');
var imageDataURI    = require('gulp-image-data-uri');
var notify          = require('gulp-notify');
var rename          = require('gulp-rename');
var sass            = require('gulp-sass');
var svgmin          = require('gulp-svgmin');
var uglify	        = require('gulp-uglify');

gulp.task('default', ['sass', 'js'], function(){
	gulp.src('.')
		.pipe(notify({
			title: 'Build completed successfully'
		}));
});

// optimize all lens SVGs, convert them to data URIs, and assemble a lens definitions JS file
gulp.task('svg', function () {
    return gulp.src('./src/svg/*.svg')
        .pipe(svgmin())
        .pipe(imageDataURI({
            template: {
                file: './src/js/lens-definitions.js.tpl'
            }
        }))
        .pipe(concat('./src/js/lens-definitions.js'))
        .pipe(gulp.dest('.'));
});

// concatenate dynamically generated lens definitions (run the svg task first) to end of main JS
gulp.task('js', ['svg'], function(){
	return gulp.src(['./src/js/jquery.xrayglasses.js', './src/js/lens-definitions.js'])
		.pipe(concat('jquery.xrayglasses.js'))
		.pipe(gulp.dest('./dist/'))
		.pipe(uglify())
		.pipe(rename('jquery.xrayglasses.min.js'))
		.pipe(gulp.dest('./dist/'));
});

// compile SASS to CSS
gulp.task('sass', function() {
    return gulp.src('./src/sass/jquery.xrayglasses.scss')
        .pipe(
			sass({
				outputStyle: 'compressed'
			})
            .on('error', function(err){
                console.log(err.messageFormatted);
                this.emit('end');
            })
		)
		.pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function(){
    gulp.watch('./src/**/*', ['default']);
});
