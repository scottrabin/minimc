function VideoLibraryCtrl($scope, VideoLibrary, Player) {
	$scope.movies = VideoLibrary.getMovies();

	$scope.playMovie = function(movie) {
		Player.open(movie);
	};
}
