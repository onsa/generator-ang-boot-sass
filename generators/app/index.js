'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var appName;
var baseDir;
var baseRef;
var generator;

var prepareAppName = function(rawAppName) {
	rawAppName = rawAppName.replace(/(-.)/g, function(letter){return letter.toUpperCase()});
	rawAppName = rawAppName.replace(/(&.)/g, function(letter){return letter.toUpperCase()});
	rawAppName = rawAppName.replace(/(\s.)/g, function(letter){return letter.toUpperCase()});
	return rawAppName.charAt(0).toUpperCase() + rawAppName.slice(1);
};

var getBaseRef = function(path) {
	if (path.indexOf('/var/www/html/') > -1) {
  	return path.slice(13)+'/';
  } else if (path.indexOf('/var/www/') > -1) {
  	return path.slice(8)+'/';
  }
}

module.exports = yeoman.generators.Base.extend({
	init: function () {
		generator = this;
	},
	prompting: function () {
		var done = this.async();
		// Have Yeoman greet the user.
		this.log(yosay('Welcome to the ' + chalk.red('Angular') + ' app generator!'));

		//  Questions to ask the user
		var prompts = [
			{
				type: 'input',
				name: 'name',
				message: 'What should we call the app?',
				default: this.appName
			},
			{
				type: 'input',
				name: 'description',
				message: 'How should we decribe the app?',
				default: this.appDescription
			},
			{
				type: 'confirm',
				name: 'router',
				message: 'Would you rather use UI Router instead of Angular Route?',
				default: false				
			}
		];

		//  Ask questions.
		this.prompt(prompts, function (props) {
			this.props = props;
			// To access props later use this.props.someOption;
			this.appName = this.props.name;
			appName = prepareAppName(this.appName);
			baseDir = this.destinationRoot();
			baseRef = getBaseRef(baseDir)+this.appName+'/public/';
			this.appDescription = this.props.description;
			//	set variables based on route answer
			this.route = {};
			if (this.props.router) {
				this.route.module = 'angular-ui-router';
				this.route.viewDirective = 'ui-view="content"';
				this.route.config = '_app.ui.js';
				this.route.path = 'angular-ui-router/release/angular-ui-router.min.js';
			} else {
				this.route.module = 'angular-route';
				this.route.viewDirective = 'ng-view';
				this.route.config = '_app.js';
				this.route.path = 'angular-route/angular-route.min.js';
			}
			this.config.set('appName', this.appName);
			this.config.save();
			done();
		}.bind(this));
	},

	default: function () {
		this.log(yosay('Please wait while ' + chalk.red('Angular') + ' is being installed!'));
		this.destinationRoot(baseDir+'/'+this.appName);
		var createPublicSrc = this.spawnCommand('mkdir', ['public-src']);
		createPublicSrc.on('close', function(argument) {

			generator.fs.copyTpl(
				generator.templatePath('package.json'),
				generator.destinationPath('package.json'),
				{ appName: generator.appName,
				  appDescription: generator.appDescription
				}
			);

			generator.fs.copyTpl(
				generator.templatePath('_index.html'),
				generator.destinationPath('public-src/index.html'),
				{ AppName: appName,
				  baseRef: baseRef,
				  appName: generator.appName,
				  appRoute: generator.route.path,
				  routeView: generator.route.viewDirective
				}
			);

			generator.fs.copyTpl(
				generator.templatePath(generator.route.config),
				generator.destinationPath('public-src/js/app.js'),
				{ appName: generator.appName }
			);

			generator.fs.copyTpl(
				generator.templatePath('_mainCtrl.js'),
				generator.destinationPath('public-src/js/controllers/mainCtrl.js'),
				{ appName: generator.appName,
				  logout: generator.route.logout
				}
			);

			generator.fs.copy(
				generator.templatePath('_main.scss'),
				generator.destinationPath('public-src/styles/main.scss')
			);

			generator.fs.copy(
				generator.templatePath('_main.html'),
				generator.destinationPath('public-src/views/main.html')
			);

			//  Fetch front dependencies.
			generator.log(yosay('Fetching front ' + chalk.red('dependencies') + '.'));
			var npmInstall = generator.spawnCommand('npm', ['install', '--save-dev',
																				'bootstrap',
																				'time-grunt',
																				'angular',
																				generator.route.module,
																				'bootstrap-sass',
																				'grunt',
																				'grunt-contrib-clean',
																				'grunt-contrib-concat',
																				'grunt-contrib-copy',
																				'grunt-contrib-cssmin',
																				'grunt-contrib-jshint',
																				'grunt-contrib-uglify',
																				'grunt-contrib-watch',
																				'grunt-jscs',
																				'grunt-sass',
																				'grunt-usemin',
																				'jit-grunt',
																				'jshint',
																				'jshint-stylish'
																			 ]);

			npmInstall.on('close', function(argument) {
				generator.destinationRoot(baseDir+'/'+generator.appName+'/node_modules');
				var gitInstall = generator.spawnCommand('git', ['clone', 'https://github.com/tagawa/bootstrap-without-jquery.git']);

				//  Copy Gruntfile + .jschintrc + .jscsrc
				generator.log(yosay('Configuring and running ' + chalk.red('grunt') + '.'));
				generator.destinationRoot(baseDir+'/'+generator.appName);
				generator.fs.copy(
					generator.templatePath('Gruntfile.js'),
					generator.destinationPath('Gruntfile.js')
				);

				generator.fs.copy(
					generator.templatePath('.jshintrc'),
					generator.destinationPath('.jshintrc')
				);

				generator.fs.copy(
					generator.templatePath('.jscsrc'),
					generator.destinationPath('.jscsrc')
				);

				//  Run Grunt.
				var runGrunt = generator.spawnCommand('grunt');
				runGrunt.on('close', function(argument){
					//  Create symlink for node_module to be accessible from within base href.
					generator.spawnCommand('ln', ['-s', baseDir+'/'+generator.appName+'/node_modules', baseDir+'/'+generator.appName+'/public']);
				}.bind(generator));
			}.bind(generator));

		});
	}
});