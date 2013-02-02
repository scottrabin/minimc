'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'hbs!views/movies',
],
function(defineComponent, VideoLibrary, movieTemplate) {

	return defineComponent(movieViewer);

	function movieViewer() {

		this.after('initialize', function() {
			var self = this;
			VideoLibrary.getMovies().then(function(movies) {
				self.node.innerHTML = movieTemplate({ movies : movies });
			});

			this.on('show', function() {
				this.$node.show();
			});
			this.on('hide', function() {
				this.$node.hide();
			});
		});
	}
});
