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

		this.show = function() {
			this.setContent(
				this.$node,
				movieTemplate,
				VideoLibrary.getMovies().
					then(function(movies) {
						return {
							"movies" : _.sortBy(movies, comparator_by_name),
						};
					})
			);
		};

		this.after('initialize', function() {
			this.on('show', this.show);
			this.activateOn(document, 'viewMovies');
		});
	}

	function comparator_by_name(movie) {
		return movie.title.toLowerCase().charCodeAt(0);
	}
});
