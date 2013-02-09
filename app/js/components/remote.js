'use strict';

define([
	'components/flight/lib/component',
	'js/services/Player',
	'js/services/Input',
	'underscore',
	'js/utility/features',
	'hbs!views/subtitles',
], function(defineComponent, Player, Input, _, features, subtitleTemplate) {

	var DRAG_THRESHOLD = 50;
	var REGEX_ARROW_DIRECTION = /(up|down|left|right)/;

	return defineComponent(remote);

	function remote() {

		this.defaultAttrs({
			"selectorRewind" : ".rewind",
			"selectorPlayPause" : ".play-pause",
			"selectorFastForward" : ".forward",
			"selectorStop" : ".stop",
			"selectorGrip" : "#grippy-grip",
			"selectorArrowUp" : "#remote-navigation .arrow.up",
			"selectorArrowDown" : "#remote-navigation .arrow.down",
			"selectorArrowLeft" : "#remote-navigation .arrow.left",
			"selectorArrowRight" : "#remote-navigation .arrow.right",
			"selectorGuiSelect" : "#remote-navigation .enter",
			"selectorSubtitles" : "#playback-subtitles",
			"selectorSubtitleButton" : "#playback-subtitles button",
			"selectorMenuButton" : "button.menu",
			"selectorHomeButton" : "button.home",
			"selectorBackButton" : "button.back",
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

		this.stop = Player.stop;

		this.move = function(event) {
			Input.move( REGEX_ARROW_DIRECTION.exec($(event.target).attr('class'))[1] );
		};

		this.guiSelect = Input.select;

		this.updateControl = function(event, speed) {
			this.select('selectorPlayPause').
				toggleClass('icon-play', speed !== 1).
				toggleClass('icon-pause', speed === 1);
		}

		this.updateSubtitles = function(event, subtitles) {
			var currentSubtitle = (Player.areSubtitlesEnabled() ? Player.getCurrentSubtitle().index : null);
			if (!_.isEqual(this.select('selectorSubtitles').data('source'), subtitles)) {
				this.select('selectorSubtitles').
					data('source', subtitles).
					html( subtitleTemplate({
						currentSubtitle : currentSubtitle,
						subtitles : subtitles
					}) );
			}
			this.select('selectorSubtitleButton').removeClass('active').
				filter('[data-index=' + currentSubtitle + ']').addClass('active');
		};

		this.activateSubtitle = function(event) {
			var $target = $(event.target),
				index   = $target.attr('data-index');

			if ($target.hasClass('active')) {
				// do nothing if it's already active
				return;
			}
			Player.setSubtitle(
				index === 'null' ? null :
				_.findWhere(
					this.select('selectorSubtitles').data('source'),
					{ index : parseInt(index, 10) }
				)
			);
		};

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
				"selectorFastForward" : this.fastForward,
				"selectorStop" : this.stop,
				"selectorArrowUp" : this.move,
				"selectorArrowDown" : this.move,
				"selectorArrowLeft" : this.move,
				"selectorArrowRight" : this.move,
				"selectorGuiSelect" : this.guiSelect,
				"selectorSubtitleButton" : this.activateSubtitle,
				"selectorMenuButton" : Input.menu,
				"selectorHomeButton" : Input.home,
				"selectorBackButton" : Input.back,
			});

			this.on(document, 'playerSpeedChanged', this.updateControl);
			this.on(document, 'playerSubtitlesChanged', this.updateSubtitles);

			if (features.touch) {
				this.on('mousedown', {
					"selectorGrip" : this.startDrag,
				});
				this.on('touchstart', {
					"selectorGrip" : this.startDrag,
				});
			}
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
