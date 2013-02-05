'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'js/mixins/main-view',
	'hbs!views/tv-shows',
],
function(defineComponent, VideoLibrary, mainView, tvShowTemplate) {

	return defineComponent(tvShowViewer, mainView);

	function tvShowViewer() {

		this.after('initialize', function() {
			var self = this;
			VideoLibrary.getShows().then(function(tv_shows) {
				self.node.innerHTML = tvShowTemplate({ tv_shows : tv_shows });
			});

			this.activateOn(document, 'viewTVShows');
		});
	}
});
