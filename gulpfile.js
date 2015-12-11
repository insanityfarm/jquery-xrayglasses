'use strict';

var gulp    = require('gulp');
var notify  = require('gulp-notify');
var sass    = require('gulp-sass');
var uglify	= require('gulp-uglify');

gulp.task('default', ['sass', 'js'], function(){
	gulp.src('.')
		.pipe(notify({
			title: 'Build completed successfully'
		}));
});

gulp.task('js', function(){
	return gulp.src('./src/js/*.js')
		.pipe(uglify())
		.pipe(gulp.dest('./dist/'));
});

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
