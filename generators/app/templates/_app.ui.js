'use strict';

angular.module('<%= appName %>App', ['ui.router'])
	.config(['$locationProvider', '$stateProvider', '$urlRouterProvider', function($locationProvider, $stateProvider, $urlRouterProvider) {
		$locationProvider.html5Mode(true);
		$stateProvider.state('home', {
			url: '/',
			views: {
				'content': {
					templateUrl: 'views/main.html',
					controller: 'mainCtrl'
				}
			}
		})
		.state('login', {
			url: 'login'
		});
		$urlRouterProvider.otherwise('/');
	}]);