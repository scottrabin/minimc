"use strict";

WeXBMC.factory('Player', ['XbmcRpc', function(XbmcRpc) {
	var PLAYER_PROPERTY_NAMES = [
		"type",
		"partymode",
		"speed",
		"time",
		"percentage",
		"totaltime",
		"playlistid",
		"position",
		"repeat",
		"shuffled",
		"canseek",
		"canchangespeed",
		"canmove",
		"canzoom",
		"canrotate",
		"canshuffle",
		"canrepeat",
		"currentaudiostream",
		"audiostreams",
		"subtitleenabled",
		"currentsubtitle",
		"subtitles"
	];

	var activePlayer = null,
		isActive = false,
		activePlayerUpdateTimer;

	function updateActivePlayer() {
		return XbmcRpc.Player.getActivePlayers().then(function(players) {
			activePlayer = players[0] || null;

			isActive = (activePlayer !== null);

			if (isActive) {
				return XbmcRpc.Player.GetProperties(activePlayer.playerid, PLAYER_PROPERTY_NAMES).then(function(properties) {
					properties.playerid = activePlayer.playerid;
					activePlayer = properties;
				});
			}
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
			// always clear the timeout
			clearTimeout(activePlayerUpdateTimer);

			if (on) {
				// attempt to restart the update checker if specified
				updateActivePlayer().then(autoUpdate);
			}
		},
		play : function() {
			if (isActive && activePlayer.speed === 0) {
				return XbmcRpc.Player.PlayPause(activePlayer.playerid);
			}
		},
		pause : function() {
			if (isActive && activePlayer.speed > 0) {
				return XbmcRpc.Player.PlayPause(activePlayer.playerid);
			}
		},
	}
}]);
