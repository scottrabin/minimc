'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'components/when/when',
	'hbs!views/episodes',
],
function(defineComponent, VideoLibrary, when, episodeTemplate) {

	return defineComponent(episodeViewer);

	function episodeViewer() {

		this.after('initialize', function() {
			var self = this;

			this.on('show', function(event, showSlug) {

				VideoLibrary.getShowFromSlug(showSlug).
					then(function(show) {
						return when.join( VideoLibrary.getShowSeasons(show), VideoLibrary.getEpisodes(show) );
					}).
					then(function(showData) {
						self.node.innerHTML = episodeTemplate({
							season  : showData[0],
							episode : showData[1],
						});
					});
				this.$node.show();
			});
			this.on('hide', function() {
				this.$node.hide();
			});
		});
	}
});
