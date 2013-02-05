'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'hbs!views/movies',
],
function(defineComponent, VideoLibrary, mainView, promiseContent, movieTemplate) {

	return defineComponent(movieViewer, mainView, promiseContent);

	function movieViewer() {

		this.after('initialize', function() {
			this.setContent(
				this.$node,
				movieTemplate,
				VideoLibrary.getMovies().
					then(function(movies) {
						return {
							"movies" : movies,
						};
					})
			);

			this.activateOn(document, 'viewMovies');
		});
	}
});
