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
var gulpif              = require('gulp-if');
var babelify            = require('babelify');
var uglify              = require('gulp-uglify');
var WebpackDevServer    = require('webpack-dev-server');
var rename              = require('gulp-rename');
var source              = require('vinyl-source-stream');
var browserify          = require('browserify');
var gbrowserify         = require('gulp-browserify');
/**
 * parse cli options: 
 * --app=editor or client
 * --env=development or production
 */
var argv                = require('minimist')(process.argv.slice(2));
var webpackConfig       = require('./webpack.config');

var option = {
  dist: 'dist',
  src: 'src',

  server: {
    host: '0.0.0.0',
    port: 8000
  },

  proxy: {
    host: '0.0.0.0',
    port: 10006
  }
};

var src = {
  image: option.src + '/image',
  view: option.src + '/view',
  style: option.src + '/style',
  script: option.src + '/script'
};

var vendor = {
  script: {
    path: src.script + '/vendor/lib',
    src: [
      'node_modules/react-h5-video/src/utils/dateTime.js'
    ]
  },
  css: [
    'bower_components/bootstrap/dist/css/bootstrap.min.css'
  ],
  less: [
    'bower_components/bootstrap/less/bootstrap.less'
  ]
};

gulp.task('clean', function (done) {
  return gulp.src(option.dist, {
    read: false
  })
  .pipe(clean({force: true}));
})

gulp.task('vendor.script.clean', function (done) {
  return gulp.src(vendor.script.path, {
    read: false
  })
  .pipe(clean({force: true}));
})

gulp.task("vendor.script.copy", function () {
  gulp.src(vendor.script.src)
  .pipe(gulp.dest(src.script + '/vendor/lib'))
})

gulp.task('eslint', function() {
  return gulp.src(app.script + '/**/**/*.js')
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
  return gulp.src(src.script + '/*.js')
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
      proxies: [{
        source: '/api', 
        target: 'http://' + option.proxy.host + ':' + option.proxy.port + '/api',
        changeOrigin: true
      }],
      middleware: [
        getStatic({route: /^\/view/, handle: serveStatic(option.src)}),
        getStatic({route: /^\/style/, handle: serveStatic(option.src)}),
        getStatic({route: /^\/script/, handle: serveStatic(option.src)}),
        getStatic({route: /^\/video/, handle: serveStatic(option.src)}),
        getStatic({route: /^\/bower_components/, handle: serveStatic('./')}),
        getStatic({route: /^\/node_modules/, handle: serveStatic('./')})
      ]
    }));
});

gulp.task('watch', function () {
  gulp.watch(src.script + '/**/*.{js,jsx}', ['concat']);
  gulp.watch([src.view + '/*.html'], ['html']);
});

gulp.task('bower', function() {
  return bower('./bower_components')
    .pipe(gulp.dest('bower_components'))
});

gulp.task('demo.build',function(){
	gulp.src(src.script + '/demo.js')
	.pipe(gbrowserify({
		debug: argv.env !== 'production',
		insertGlobals : true,
		transform: [
			babelify.configure({
			  // optional: ["es7.asyncFunctions","runtime"]
			})
		],
	}))
	.pipe( // only minify in production
		gulpif(argv.env === 'production', uglify({ compress:true, mangle:true}))
	) 
	.on('error', handleError)
	.pipe(rename('demo.app.js'))
	.pipe(gulp.dest(src.script))
});

gulp.task('demo.open', function() {
  opn( 'http://' + option.server.host + ':' + option.server.port + '/view/demo.html' );
});

gulp.task('demo.default', ['vendor.script.clean'], function () {
  gulp.start('vendor.script.copy', 'demo.build', 'server', 'demo.open');
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

function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}
