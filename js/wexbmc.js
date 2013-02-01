var WeXBMC = angular.module('wexbmc', []).
	config(['$routeProvider', function($routeProvider) {

		$routeProvider.
			when('/remote', { templateUrl : 'views/remote.html', controller : RemoteCtrl }).
			when('/videos', { templateUrl : 'views/video-library.html', controller : VideoLibraryCtrl }).
			when('/tv-shows', { templateUrl : 'views/tv-shows.html', controller : TVShowCtrl }).
			when('/tv-shows/:tvShowName', { templateUrl : 'views/series.html', controller : SeriesCtrl }).
			otherwise({ redirectTo : '/videos' });
	}]);
