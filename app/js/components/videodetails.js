'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'hbs!views/details-movie',
	'hbs!views/details-episode',
],
function(defineComponent, VideoLibrary, movieDetails, episodeDetails) {

	return defineComponent(videoViewer);

	function videoViewer() {
		this.show = function(event, showData) {
			this.$node.show();
		};

		this.hide = function() {
			this.$node.hide();
		}

		this.showEpisodeDetails = function(event, showData) {
			var self = this;
			VideoLibrary.getShowFromSlug(showData.title_slug).
				then(function(show) {
					return VideoLibrary.getEpisodeBySeasonEpisode(show, showData.season, showData.episode);
				}).
				then(function(episode) {
					self.$node.html( episodeDetails(episode) );
				});
		};

		this.after('initialize', function() {
			this.on('show', this.show);
			this.on('hide', this.hide);

			this.on(document, 'viewEpisodeDetails', this.showEpisodeDetails);
		});
	}

	function is_movie(showData) {
		return showData && showData.hasOwnProperty('movieid');
	}
});
