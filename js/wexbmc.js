var WeXBMC = angular.module('wexbmc', []).
	config(['$routeProvider', function($routeProvider) {

		$routeProvider.
			when('/videos', { templateUrl : 'views/video-library.html', controller : VideoLibraryCtrl }).
			otherwise({ redirectTo : '/videos' });
	}]);
