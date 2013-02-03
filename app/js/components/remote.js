'use strict';

define([
	'components/flight/lib/component',
	'js/services/player',
], function(defineComponent, Player) {

	var DRAG_THRESHOLD = 50;

	return defineComponent(remote);

	function remote() {

		this.defaultAttrs({
			"selectorRewind" : ".rewind",
			"selectorPlayPause" : ".play-pause",
			"selectorFastForward" : ".forward",
			"selectorGrip" : "#grippy-grip",
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

		this.startDrag = function(event) {
			event.preventDefault();
			event.stopPropagation();
			if (!is_dragging(this)) {
				this.$node.
					addClass('dragging').
					data({
						'lastPosition' : get_y(event),
						'startPosition' : get_y(event),
					});

				this.on(document, 'mousemove', this.drag);
				this.on(document, 'touchmove', this.drag);
				this.on(document, 'mouseup', this.stopDrag);
				this.on(document, 'touchend', this.stopDrag);
			}
		};
		this.stopDrag = function(event) {
			event.preventDefault();
			event.stopPropagation();
			if (is_dragging(this)) {
				this.off(document, 'mousemove', this.drag);
				this.off(document, 'touchmove', this.drag);
				this.off(document, 'mouseup', this.stopDrag);
				this.off(document, 'touchend', this.stopDrag);
				this.$node.
					removeClass('dragging').
					css('height', this.$node.data('lastPosition') - this.$node.data('startPosition') > DRAG_THRESHOLD ? window.innerHeight : '');
			}
		};
		this.drag = function(event) {
			event.preventDefault();
			event.stopPropagation();

			// if this would cause the remote height to drop below the minimum, ignore it
			var newHeight = this.$node.height() + get_y(event) - this.$node.data('lastPosition');
			if (newHeight > min_settable_height(this.$node)) {
				this.$node.
					height( newHeight ).
					data('lastPosition', get_y(event));
			}
		};

		this.after('initialize', function() {
			this.on('click', {
				"selectorRewind" : this.rewind,
				"selectorPlayPause" : this.togglePlayPause,
				"selectorFastForward" : this.fastForward
			});

			this.on(document, 'playerSpeedChanged', this.updateControl);

			this.on('mousedown', {
				"selectorGrip" : this.startDrag,
			});
			this.on('touchstart', {
				"selectorGrip" : this.startDrag,
			});
		});
	}

	function get_y(event) {
		return (event.originalEvent.touches ? event.originalEvent.touches[0].screenY : event.pageY);
	}
	function is_dragging(component) {
		return component.$node.hasClass('dragging');
	}
	function min_settable_height($node) {
		return _.reduce(['borderTopWidth', 'paddingTop', 'paddingBottom', 'borderBottomWidth'], function(memo, prop) {
			return memo - parseFloat($node.css(prop));
		}, parseFloat($node.css('minHeight')));
	}
});
