function SeriesCtrl($scope, $routeParams, VideoLibrary, Player) {
	$scope.selected_season = 1;

	$scope.seasons  = [];
	$scope.episodes = [];
	VideoLibrary.getShowFromSlug($routeParams.tvShowName).then(function(tvShow) {
		$scope.seasons  = VideoLibrary.getShowSeasons(tvShow);
		$scope.episodes = VideoLibrary.getEpisodes(tvShow);
	});

	$scope.playEpisode = Player.playEpisode;
}
