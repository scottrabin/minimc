'use strict';

define([
	'components/flight/lib/component',
	'js/services/player',
], function(defineComponent, Player) {

	return defineComponent(remote);

	function remote() {

		this.defaultAttrs({
			"selectorRewind" : ".rewind",
			"selectorPlayPause" : ".play-pause",
			"selectorFastForward" : ".forward",
		});

		this.rewind = function() {
			Player.setSpeed('decrement');
		};

		this.togglePlayPause = function() {
			Player.togglePlaying();
		};

		this.fastForward = function() {
			Player.setSpeed('increment');
		};

		this.updateControl = function(event, speed) {
			this.select('selectorPlayPause').
				toggleClass('icon-play', speed !== 1).
				toggleClass('icon-pause', speed === 1);
		}

		this.after('initialize', function() {
			this.on('click', {
				"selectorRewind" : this.rewind,
				"selectorPlayPause" : this.togglePlayPause,
				"selectorFastForward" : this.fastForward
			});

			this.on(document, 'playerSpeedChanged', this.updateControl);
		});
	}
});
