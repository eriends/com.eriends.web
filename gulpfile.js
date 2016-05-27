var gulp                = require('gulp');
var bower               = require('gulp-bower');
var clean               = require("gulp-clean");
var eslint              = require('gulp-eslint');
var webserver           = require('gulp-webserver');
var opn                 = require('opn');
var browserSync         = require('browser-sync').create();
var livereload          = require('gulp-livereload');
var serveStatic         = require('serve-static');
var parseurl            = require('parseurl');
var babel               = require('gulp-babel');
var gutil               = require('gulp-util');
var webpack             = require('webpack');
var webpackConfig       = require('./webpack.config');
var WebpackDevServer    = require('webpack-dev-server');


var option = {
  dist: 'dist',
  src: 'src',

  server: {
    host: '0.0.0.0',
    port: 8000
  },

  proxy: {
    host: 'localhost',
    port: 10006
  }
};

var src = {
  images: option.src + '/images',
  views: option.src + '/views',
  styles: option.src + '/styles',
  scripts: option.src + '/scripts'
};

gulp.task('clean', function (done) {
  return gulp.src(option.dist, {
    read: false
  })
  .pipe(clean({force: true}));
})

gulp.task('eslint', function() {
  return gulp.src(app.scripts + '/**/**/*.js')
    .pipe(eslint({
      baseoptionig: {
        "ecmaFeatures": {
           "jsx": true
         }
      }
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

function getStatic(opts) {
  return function(req, res, next) {
    if (parseurl(req).pathname.match(opts.route)) {
      return opts.handle(req, res, next);
    } else {
      return next();
    }
  }
}

gulp.task('babel', () => {
  return gulp.src(src.scripts + '/*.js')
    .pipe(babel())
    .pipe(gulp.dest('target'));
});

gulp.task('webpack', ['babel'], function(callback) {
  var myConfig = Object.create(webpackConfig);
  myConfig.plugins = [
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin()
  ];

  // run webpack
  webpack(myConfig, function(err, stats) {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack]', stats.toString({
      colors: true,
      progress: true
    }));
    callback();
  });
});

gulp.task('dev-server', ['webpack'], function(callback) {
	// modify some webpack config options
	var myConfig = Object.create(webpackConfig);
	myConfig.devtool = 'eval';
	myConfig.debug = true;

	// Start a webpack-dev-server
	new WebpackDevServer(webpack(myConfig), {
		publicPath: '/' + myConfig.output.publicPath,
		stats: {
			colors: true
		},
		hot: true
	}).listen(9000, 'localhost', function(err) {
		if(err) throw new gutil.PluginError('webpack-dev-server', err);
		gutil.log('[dev-server]', 'http://localhost:9000/src/index.html');
	});
});

gulp.task('server', function() {
  gulp.src([option.src, 'bower_components', 'node_modules'])
    .pipe(webserver({
      host: option.server.host,
      port: option.server.port,
      livereload: true,
      directoryListing: true,
      defaultFile: 'index.html',
      open: true,
      middleware: [
        getStatic({route: /^\/views/, handle: serveStatic(option.src)}),
        getStatic({route: /^\/styles/, handle: serveStatic(option.src)}),
        getStatic({route: /^\/scripts/, handle: serveStatic(option.src)}),
        getStatic({route: /^\/movies/, handle: serveStatic(option.src)}),
        getStatic({route: /^\/bower_components/, handle: serveStatic('./')}),
        getStatic({route: /^\/node_modules/, handle: serveStatic('./')})
      ]
    }));
});

gulp.task('watch', function () {
  gulp.watch(src.scripts + '/**/*.{js,jsx}', ['concat']);
  gulp.watch([src.views + '/*.html'], ['html']);
});

gulp.task('bower', function() {
  return bower('./bower_components')
    .pipe(gulp.dest('bower_components'))
});


gulp.task('openbrowser', function() {
  opn( 'http://' + option.server.host + ':' + option.server.port );
});

gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: option.src
    }
  });
});

gulp.task('default', ['clean', 'server', 'watch', 'openbrowser']);
