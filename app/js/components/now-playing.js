'use strict';

define([
	'components/flight/lib/component',
	'js/services/player',
	'js/filters/formatTime',
], function(defineComponent, Player, formatTime) {

	// the Now Playing component should manage most of the player state
	setInterval(Player.update, 5000);

	return defineComponent(nowPlaying);

	function nowPlaying() {
		var intervalTimerUpdate;

		this.defaultAttrs({
			"selectorStatus" : ".status",
			"selectorTitle"  : ".current-item",
			"selectorElapsedTime" : ".elapsed",
			"selectorTotalTime"   : ".total",
		});

		function processPlayerStateChanged(playerState) {
			this.select('selectorStatus').
				toggleClass('icon-play', playerState.speed !== 0).
				toggleClass('icon-pause', playerState.speed === 0);

			this.select('selectorTitle').html( playerState.currentitem ? playerState.currentitem.title : 'None' );

			this.updatePlayTime(playerState);

			// trigger some specific global events
			$(document).trigger('playerSpeedChanged', playerState.speed);
		}

		this.updatePlayTime = function(playerState) {
			this.select('selectorElapsedTime').html( formatTime(playerState.time) );
			this.select('selectorTotalTime').html( formatTime(playerState.totaltime) );
		}

		this.after('initialize', function() {
			Player.notify(_.bind(processPlayerStateChanged, this));
		});
	}
});
