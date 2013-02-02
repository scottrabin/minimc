'use strict';

define(
[
	'components/flight/lib/component',
	'js/components/movieviewer',
	'js/components/tvshowviewer',
	'js/components/episodeviewer',
],
function(defineComponent, movieViewer, tvShowViewer, episodeViewer) {

	return defineComponent(videoViewer);

	function videoViewer() {


		this.defaultAttrs({
			"selectorMovieViewer" : "#movies",
			"selectorTVShowViewer" : "#tv-shows",
			"selectorEpisodeViewer" : "#episodes",
		});

		this.activate = function(selector, param) {
			this.select('selectorMovieViewer').trigger(selector === 'selectorMovieViewer' ? 'show' : 'hide', param);
			this.select('selectorTVShowViewer').trigger(selector === 'selectorTVShowViewer' ? 'show' : 'hide', param);
			this.select('selectorEpisodeViewer').trigger(selector === 'selectorEpisodeViewer' ? 'show' : 'hide', param);
		};

		this.viewMovies = function() {
			this.activate('selectorMovieViewer');
		};

		this.viewTVShows = function() {
			this.activate('selectorTVShowViewer');
		};

		this.viewEpisodes = function(event, showSlug) {
			this.activate('selectorEpisodeViewer', showSlug);
		};

		// bind events
		this.after('initialize', function() {
			this.on(document, 'viewMovies', this.viewMovies);
			this.on(document, 'viewTVShows', this.viewTVShows);
			this.on(document, 'viewEpisodes', this.viewEpisodes);

			movieViewer.attachTo(this.select('selectorMovieViewer'));
			tvShowViewer.attachTo(this.select('selectorTVShowViewer'));
			episodeViewer.attachTo(this.select('selectorEpisodeViewer'));

		});
	}
});
