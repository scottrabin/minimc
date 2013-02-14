'use strict';

define([
	'components/flight/lib/component',
	'js/services/Player',
	'js/filters/formatTime',
	'js/filters/itemLink',
	'js/filters/lpad',
	'js/utility/video_type',
], function(defineComponent, Player, formatTime, itemLink, lpad, videoType) {

	return defineComponent(nowPlaying);

	function nowPlaying() {

		this.defaultAttrs({
			"selectorStatus" : ".status",
			"selectorTitle"  : ".current-item",
			"selectorPlayTime"    : ".playtime",
			"selectorElapsedTime" : ".elapsed",
			"selectorTotalTime"   : ".total",
		});

		function processPlayerStateChanged(playerState) {
			this.trigger(playerState.currentitem ? 'show' : 'hide');

			this.select('selectorStatus').
				toggleClass('icon-play', playerState.speed !== 1).
				toggleClass('icon-pause', playerState.speed === 1);

			this.select('selectorTitle').
				attr('href', playerState.currentitem ? itemLink(playerState.currentitem) : 'javascript:void(0)').
				html( playerState.currentitem ? format_video_name(playerState.currentitem) : 'None' );

			this.updatePlayTime(playerState);

			// trigger some specific global events
			$(document).trigger('playerSpeedChanged', playerState.speed);
			$(document).trigger('playerSubtitlesChanged', [playerState.subtitles]);
		}

		this.updatePlayTime = function(playerState) {
			if (playerState.time && playerState.totaltime) {
				this.select('selectorElapsedTime').html( formatTime(playerState.time) );
				this.select('selectorTotalTime').html( formatTime(playerState.totaltime) );
				this.select('selectorPlayTime').show();
			} else {
				this.select('selectorPlayTime').hide();
			}
		}

		this.show = function() {
			this.$node.addClass('active');
		};

		this.hide = function() {
			this.$node.removeClass('active');
		};

		this.after('initialize', function() {
			var updateComponent = _.bind(processPlayerStateChanged, this);
			Player.notify(updateComponent);
			Player.update().then(updateComponent);

			this.on('show', this.show);
			this.on('hide', this.hide);
		});
	}

	function format_video_name(videoFile) {
		switch(videoType(videoFile)) {
			case 'movie' :
				return videoFile.title;
			case 'episode' :
				return videoFile.showtitle + ' S' + lpad(videoFile.season, 2) + 'E' + lpad(videoFile.episode, 2) + ': ' + videoFile.title;
			default :
				return '(unknown file type)';
		}
	}
});
