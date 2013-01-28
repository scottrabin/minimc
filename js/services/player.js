"use strict";

WeXBMC.factory('Player', ['XbmcRpc', function(XbmcRpc) {
	var activePlayer = null,
		isActive = false,
		speed = 0,
		activePlayerUpdateTimer;

	function updateActivePlayer() {
		return XbmcRpc.Player.getActivePlayers().then(function(players) {
			activePlayer = players[0] || null;

			isActive = (activePlayer !== null);
		});
	}

	function autoUpdate() {
		activePlayerUpdateTimer = setTimeout(function() {
			updateActivePlayer().then(autoUpdate);
		}, 5000);
	}

	return {
		isActive : function() {
			return isActive;
		},
		autoupdate : function(on) {
			if (on) {
				updateActivePlayer().then(autoUpdate);
			} else {
				clearTimeout(activePlayerUpdateTimer);
			}
		},
		play : function() {
			if (isActive && speed === 0) {
				return XbmcRpc.Player.PlayPause(activePlayer.playerid);
			}
		},
		pause : function() {
			if (isActive && speed > 0) {
				return XbmcRpc.Player.PlayPause(activePlayer.playerid);
			}
		},
	}
}]);
