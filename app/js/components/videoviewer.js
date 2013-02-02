'use strict';

define(
[
	'components/flight/lib/component',
	'js/components/movieviewer',
	'js/components/tvshowviewer',
],
function(defineComponent, movieViewer, tvShowViewer) {

	return defineComponent(videoViewer);

	function videoViewer() {
		this.defaultAttrs({
			"selectorMovieViewer" : "#movies",
			"selectorTVShowViewer" : "#tv-shows",
		});

		this.viewMovies = function() {
			this.select('selectorMovieViewer').trigger('show');
			this.select('selectorTVShowViewer').trigger('hide');
		};

		this.viewTVShows = function() {
			this.select('selectorMovieViewer').trigger('hide');
			this.select('selectorTVShowViewer').trigger('show');
		};

		// bind events
		this.after('initialize', function() {
			this.on(document, 'viewMovies', this.viewMovies);
			this.on(document, 'viewTVShows', this.viewTVShows);

			movieViewer.attachTo('#movies');
			tvShowViewer.attachTo('#tv-shows');

		});
	}
});
