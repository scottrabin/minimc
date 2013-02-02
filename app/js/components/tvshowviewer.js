'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'hbs!views/tv-shows',
],
function(defineComponent, VideoLibrary, tvShowTemplate) {

	return defineComponent(tvShowViewer);

	function tvShowViewer() {

		this.after('initialize', function() {
			var self = this;
			VideoLibrary.getShows().then(function(tv_shows) {
				self.node.innerHTML = tvShowTemplate({ tv_shows : tv_shows });
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
