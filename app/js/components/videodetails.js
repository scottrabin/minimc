'use strict';

define(
[
	'components/flight/lib/component',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'js/services/VideoLibrary',
	'js/services/Player',
	'hbs!views/details-movie',
	'hbs!views/details-episode',
],
function(defineComponent, mainView, promiseContent, VideoLibrary, Player, movieDetails, episodeDetails) {

	return defineComponent(videoViewer, mainView, promiseContent);

	function videoViewer() {

		this.defaultAttrs({
			"selectorVideoImage" : ".video-image",
		});

		this.showEpisodeDetails = function(event, showData) {
			this.setContent(
				this.$node,
				episodeDetails,
				VideoLibrary.getShowFromSlug(showData.title_slug).
					then(function(show) {
						return VideoLibrary.getEpisodeBySeasonEpisode(show, showData.season, showData.episode);
					})
			).then(function(contentData) {
				var node = contentData[0], episode = contentData[1];
				node.removeClass('movie').addClass('episode').data('source', episode);
			});
		};

		this.showMovieDetails = function(event, movieData) {
			this.setContent(
				this.$node,
				movieDetails,
				VideoLibrary.getMovieFromSlug(movieData.title_slug)
			).then(function(contentData) {
				var node = contentData[0], movie = contentData[1];
				node.removeClass('episode').addClass('movie').data('source', movie);
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
