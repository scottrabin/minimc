function TVShowCtrl($scope, VideoLibrary) {
	$scope.tv_series = VideoLibrary.getShows();
}
