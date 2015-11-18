var gulp = require('gulp');
var path = require('path');
var plugins = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*', 'add-stream', 'del'],
	replaceString: /\bgulp[\-.]/
});

var tsProject = plugins.typescript.createProject('tsconfig.json');

/*********************************************
* Define project folder paths
*********************************************/
var paths = {
	tsFiles: ['app/**/*.ts', '!app/**/*Spec.js'],
	htmlPartials: 'app/**/*.html',
	indexFilePath: './',
	indexFileName: 'index.html',
	jsFolder: 'assets/js/',
	styles: 'assets/css/main.css',
	assets: ['assets/**', '!assets/{js,js/**}', '!assets/{libs,libs/**}', '!assets/{css,css/**}'],
	assetsFolder: 'assets/',
	build: 'build/'
};


/*********************************************
* TASK: gulp
* Start server and watch for file changes
*********************************************/
gulp.task('default', ['connect:dev'], function () {
	plugins.watch(paths.htmlPartials, function() { gulp.start(['create-template-cache']); });
	plugins.watch(paths.tsFiles, function() { gulp.start(['compile:ts']); });
	gulp.watch(paths.indexFilePath + paths.indexFileName, ['reload']);
	gulp.watch(paths.styles, ['reload']);
});

/*********************************************
* TASK: connect:build
* Start build server
*********************************************/
gulp.task('connect:build', function () {
	plugins.connect.server({
		root: [paths.build],
		port: 8080
	});
});

/*********************************************
* TASK: connect:dev
* Start development server
*********************************************/
gulp.task('connect:dev', ['compile:ts', 'create-template-cache'], function () {
	plugins.connect.server({
		root: path.resolve(paths.indexFilePath),
		port: 8000,
		livereload: true
	});
});





/*********************************************
* TASK: compile:ts
* Compile all TypeScript files to JavaScript
*********************************************/
gulp.task('compile:ts', [], function () {
	return tsProject.src()
		.pipe(plugins.typescript(tsProject))
		.pipe(gulp.dest(paths.indexFilePath))		
		.pipe(plugins.connect.reload());
});

/*********************************************
 * TASK: create-template-cache
 * Return stream of 'templates' module. 'templates' loads HTML partials to $templateCache
*********************************************/
gulp.task('create-template-cache', function () {
	return gulp.src(paths.htmlPartials)
		.pipe(plugins.htmlmin({ collapseWhitespace: true, removeComments: true }))
		.pipe(plugins.angularTemplatecache({ standalone: true }))
		.pipe(gulp.dest(paths.jsFolder))
		.pipe(plugins.connect.reload());
});

/*********************************************
* TASK: reload
* Reload server
*********************************************/
gulp.task('reload', function () {
	gulp.src(paths.indexFilePath + paths.indexFileName)
		.pipe(plugins.connect.reload());
});






/*********************************************
* TASK: build
* Compile build files
*********************************************/
gulp.task('build', ['usemin', 'copy-assets']);

/*********************************************
* TASK: usemin
* Compile and minify resources
*********************************************/
gulp.task('usemin', ['clean:build', 'create-template-cache', 'compile:ts'], function () {
	gulp.src(paths.indexFilePath + paths.indexFileName)
		.pipe(plugins.usemin({
			css: ['concat', plugins.autoprefixer('last 2 versions'), plugins.minifyCss({
				keepSpecialComments: 0
			})],
			vendor: ['concat', plugins.stripDebug(), plugins.uglify()],
			js: ['concat', plugins.stripDebug(), plugins.uglify()]
		}))
		.pipe(gulp.dest(paths.build));
});

/*********************************************
* TASK: clean:build
* Reset build folder
*********************************************/
gulp.task('clean:build', function () {
	return plugins.del([
		paths.build
	])
});

/*********************************************
* TASK: copy-assets
* Copy remaining assets
*********************************************/
gulp.task('copy-assets', ['clean:build'], function () {
    return gulp.src(paths.assets).pipe(gulp.dest(paths.build + paths.assetsFolder));
});