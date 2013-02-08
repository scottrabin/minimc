'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'js/utility/sort_alphabetic',
	'hbs!views/movies',
],
function(defineComponent, VideoLibrary, mainView, promiseContent, sort_alphabetic, movieTemplate) {

	return defineComponent(movieViewer, mainView, promiseContent);

	function movieViewer() {

		this.show = function() {
			this.setContent(
				this.$node,
				movieTemplate,
				VideoLibrary.getMovies().
					then(function(movies) {
						return {
							"movies" : movies.sort(sort_alphabetic('title')),
						};
					})
			);
		};

		this.after('initialize', function() {
			this.on('show', this.show);
			this.activateOn(document, 'viewMovies');
		});
	}
});
