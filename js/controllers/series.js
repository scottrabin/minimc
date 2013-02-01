function SeriesCtrl($scope, $routeParams, VideoLibrary) {
	$scope.series = VideoLibrary.getShowFromSlug($routeParams.tvShowName);
	$scope.selected_season = 1;

	$scope.seasons = VideoLibrary.getShowSeasons($scope.series);
	$scope.episodes = VideoLibrary.getEpisodes($scope.series);
}
