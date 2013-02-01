function RemoteCtrl($scope, Player) {
	Player.autoupdate(true);

	$scope.play = Player.play;

	$scope.pause = Player.pause;

	$scope.isPlaying = Player.isPlaying;

	$scope.togglePlayPause = Player.togglePlaying;
	$scope.decreaseSpeed = function() {
		Player.setSpeed('decrement');
	};
	$scope.increaseSpeed = function() {
		Player.setSpeed('increment');
	};

	$scope.$on('$destroy', function() {
		Player.autoupdate(false);
	});
}
