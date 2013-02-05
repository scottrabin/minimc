'use strict';

define(
[
	'components/flight/lib/component',
	'js/mixins/main-view',
	'js/services/VideoLibrary',
	'js/services/Player',
	'js/utility/showLoading',
	'hbs!views/details-movie',
	'hbs!views/details-episode',
],
function(defineComponent, mainView, VideoLibrary, Player, showLoading, movieDetails, episodeDetails) {

	return defineComponent(videoViewer, mainView);

	function videoViewer() {

		this.defaultAttrs({
			"selectorVideoImage" : ".video-image",
		});

		this.showEpisodeDetails = function(event, showData) {
			var self = this;
			showLoading(this.$node);
			VideoLibrary.getShowFromSlug(showData.title_slug).
				then(function(show) {
					return VideoLibrary.getEpisodeBySeasonEpisode(show, showData.season, showData.episode);
				}).
				then(function(episode) {
					self.$node.
						removeClass('movie').
						addClass('episode').
						data( 'source', episode ).
						html( episodeDetails(episode) );
				});
		};

		this.showMovieDetails = function(event, movieData) {
			var self = this;
			showLoading(this.$node);
			VideoLibrary.getMovieFromSlug(movieData.title_slug).
				then(function(movie) {
					self.$node.
						removeClass('episode').
						addClass('movie').
						data( 'source', movie ).
						html( movieDetails(movie) );
				});
		};

		this.playVideo = function(event) {
			var playWhich = (this.$node.hasClass('movie') ? 'playMovie' : 'playEpisode');

			Player[playWhich]( this.$node.data('source') );
		}

		this.after('initialize', function() {
			this.on('show', this.show);
			this.on('hide', this.hide);

			this.on('click', {
				'selectorVideoImage': this.playVideo,
			});

			this.on(document, 'viewEpisodeDetails', this.showEpisodeDetails);
			this.on(document, 'viewMovieDetails', this.showMovieDetails);
			this.activateOn(document, 'viewEpisodeDetails viewMovieDetails');
		});
	}

	function is_movie(showData) {
		return showData && showData.hasOwnProperty('movieid');
	}
});
