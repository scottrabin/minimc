'use strict';

define(
[
	'components/flight/lib/component',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'js/services/VideoLibrary',
	'js/services/Player',
	'js/utility/sort_alphabetic',
	'js/utility/video_type',
	'hbs!views/details-movie',
	'hbs!views/details-episode',
],
function(defineComponent, mainView, promiseContent, VideoLibrary, Player, sort_alphabetic, video_type, movieDetails, episodeDetails) {

	return defineComponent(videoViewer, mainView, promiseContent);

	function videoViewer() {

		this.defaultAttrs({
			"selectorVideoImage" : ".video-image",
		});

		this.showEpisodeDetails = function(event, showData) {
			this.setContent(
				episodeDetails,
				VideoLibrary.getShowFromSlug(showData.title_slug).
					then(function(show) {
						return VideoLibrary.getEpisodeBySeasonEpisode(show, showData.season, showData.episode);
					}).
					then(function(episode) {
						episode.cast.sort(sort_alphabetic('name'));
						return episode;
					})
			);
		};

		this.showMovieDetails = function(event, movieData) {
			this.setContent(
				movieDetails,
				VideoLibrary.getMovieFromSlug(movieData.title_slug).
					then(function(movie) {
						movie.cast.sort(sort_alphabetic('name'));
						return movie;
					})
			);
		};

		this.playVideo = function(event) {
			var playWhich = (this.$node.hasClass('movie') ? 'playMovie' : 'playEpisode');

			Player[playWhich]( this.$node.data('source') );
		}

		this.updateDetailView = function(event, tmplData) {
			var videoType = video_type(tmplData);

			$(event.target).
				toggleClass('episode', videoType == 'episode').
				toggleClass('movie', videoType == 'movie').
				data('source', tmplData);
		};

		this.after('initialize', function() {
			this.on('click', {
				'selectorVideoImage': this.playVideo,
			});

			this.on('change.content', this.updateDetailView);

			this.on(document, 'viewEpisodeDetails', this.showEpisodeDetails);
			this.on(document, 'viewMovieDetails', this.showMovieDetails);
			this.activateOn(document, 'viewEpisodeDetails viewMovieDetails');
		});
	}
});
