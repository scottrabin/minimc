'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'hbs!views/tv-shows',
],
function(defineComponent, VideoLibrary, mainView, promiseContent, tvShowTemplate) {

	return defineComponent(tvShowViewer, mainView, promiseContent);

	function tvShowViewer() {

		this.after('initialize', function() {
			this.setContent(
				this.$node,
				tvShowTemplate,
				VideoLibrary.getShows().
					then(function(tvShows) {
						return {
							"tv_shows" : tvShows,
						};
					})
			);

			this.activateOn(document, 'viewTVShows');
		});
	}
});
