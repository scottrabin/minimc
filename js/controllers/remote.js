function RemoteCtrl($scope, Player) {
	Player.autoupdate(true);

	$scope.play = Player.play;

	$scope.pause = Player.pause;

	$scope.$on('$destroy', function() {
		Player.autoupdate(false);
	});
}
