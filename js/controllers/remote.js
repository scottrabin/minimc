function RemoteCtrl($scope, Player) {
	Player.autoupdate(true);

	$scope.play = Player.play;

	$scope.pause = Player.pause;

	$scope.isPlaying = Player.isPlaying;

	$scope.togglePlayPause = Player.togglePlaying;

	$scope.$on('$destroy', function() {
		Player.autoupdate(false);
	});
}
