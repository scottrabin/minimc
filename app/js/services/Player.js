"use strict";

define([
	'js/services/XbmcRpc',
	'underscore',
	'js/services/types/list.fields.all',
	'js/services/types/player.property.name',
], function(XbmcRpc, _, LIST_FIELDS_ALL, PLAYER_PROPERTY_NAMES) {
	var activePlayer = {},
		// list of callback functions when player state changes
		__listeners   = [];

	function updateActivePlayer() {
		return XbmcRpc.Player.GetActivePlayers().
			then(function(players) {
				if (players.length > 0) {
					return players[0];
				} else {
					throw new Error("No active players")
				}
			}).
			then(updatePlayerProperties).
			then(function(activePlayer) {
				return XbmcRpc.Player.GetProperties(activePlayer.playerid, PLAYER_PROPERTY_NAMES).then(updatePlayerProperties);
			}).
			then(function(activePlayer) {
				return XbmcRpc.Player.GetItem(activePlayer.playerid, LIST_FIELDS_ALL).then(updateCurrentlyPlaying);
			});
	};

	function deactivatePlayer() {
		_.each(activePlayer, function(v, k) {
			delete activePlayer[k];
		});
		return activePlayer;
	}

	function updatePlayerProperties(properties) {
		var hasChanged = false;

		_.each(properties, function(newValue, prop) {
			hasChanged = (hasChanged || !_.isEqual(activePlayer[prop], newValue));
			activePlayer[prop] = newValue;
		});

		if (hasChanged) {
			_.each(__listeners, function(fn) {
				fn(activePlayer);
			});
		}

		return activePlayer;
	}

	function updateCurrentlyPlaying(result) {
		return updatePlayerProperties( { currentitem : result.item } );
	}

	function playItem(item) {
		return XbmcRpc.Player.Open( { item : item } );
	}

	return {
		update : updateActivePlayer,
		// Player service needs a way to notify interested parties that player state has changed
		notify : function(listener) {
			__listeners.push(listener);
		},
		play : function() {
			if (activePlayer.speed === 0) {
				return XbmcRpc.Player.PlayPause(activePlayer.playerid).then(updatePlayerProperties);
			}
		},
		pause : function() {
			if (activePlayer.speed > 0) {
				return XbmcRpc.Player.PlayPause(activePlayer.playerid).then(updatePlayerProperties);
			}
		},
		stop : function() {
			return XbmcRpc.Player.Stop(activePlayer.playerid);
		},
		togglePlaying : function() {
			return XbmcRpc.Player.PlayPause(activePlayer.playerid).then(updatePlayerProperties);
		},
		setSpeed : function(speed) {
			return XbmcRpc.Player.SetSpeed(activePlayer.playerid, speed).then(updatePlayerProperties);
		},

		/**
		 * Gets the available subtitles for the active stream
		 * TODO - why is this data not associated with videos?
		 */
		getSubtitles : function() {
			return (activePlayer ? activePlayer.subtitles : []);
		},
		getCurrentSubtitle : function() {
			return (activePlayer && activePlayer.currentsubtitle);
		},
		setSubtitle : function(subtitle) {
			return (subtitle ?
					XbmcRpc.Player.SetSubtitle(activePlayer.playerid, 'on').then(function() {
						return XbmcRpc.Player.SetSubtitle(activePlayer.playerid, subtitle.index);
					}) :
					XbmcRpc.Player.SetSubtitle(activePlayer.playerid, 'off')
				   ).then(updateActivePlayer);
		},
		areSubtitlesEnabled : function() {
			return activePlayer && activePlayer.subtitleenabled;
		},

		/**
		 * Play the specified movie
		 */
		playMovie : function(movie) {
			return playItem({ movieid : movie.movieid });
		},
		/**
		 * Play the specified episode
		 */
		playEpisode : function(episode) {
			return playItem({ episodeid : episode.episodeid });
		},

		isPlaying : function() {
			return activePlayer && activePlayer.speed === 1;
		},
	}
});
