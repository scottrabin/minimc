'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'js/mixins/main-view',
	'hbs!views/movies',
],
function(defineComponent, VideoLibrary, mainView, movieTemplate) {

	return defineComponent(movieViewer, mainView);

	function movieViewer() {

		this.after('initialize', function() {
			var self = this;
			VideoLibrary.getMovies().then(function(movies) {
				self.node.innerHTML = movieTemplate({ movies : movies });
			});

			this.activateOn(document, 'viewMovies');
		});
	}
});
