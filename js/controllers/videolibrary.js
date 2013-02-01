function VideoLibraryCtrl($scope, VideoLibrary, Player) {
	$scope.movies = VideoLibrary.getMovies();

	$scope.playMovie = Player.playMovie;
}
