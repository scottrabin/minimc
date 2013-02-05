'use strict';

define(
[
	'components/flight/lib/component',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'js/services/VideoLibrary',
	'when',
	'underscore',
	'hbs!views/episodes/seasons',
	'hbs!views/episodes/episodes',
],
function(defineComponent, mainView, promiseContent, VideoLibrary, when, _, seasonTemplate, episodeTemplate) {

	return defineComponent(episodeViewer, mainView, promiseContent);

	function episodeViewer() {
		var showCache = {};
		var currentShow, currentSeason = 1;

		this.defaultAttrs({
			"selectorSeasonList" : ".season-selector",
			"selectorEpisodeList" : ".episode-selector",
		});

		this.show = function(event, data) {
			var self = this;
			if (!showCache[data.title_slug]) {
				showCache[data.title_slug] = VideoLibrary.getShowFromSlug(data.title_slug);
			}

			// if the title slug doesn't match, re-render the season selector
			if (currentShow !== data.title_slug) {
				this.setContent(
					'selectorSeasonList',
					seasonTemplate,
					showCache[data.title_slug].
						then(VideoLibrary.getShowSeasons).
						then(function(seasons) {
							return {
								"seasons"       : seasons,
								"currentSeason" : currentSeason,
							};
						})
				);
			}
			// if the title slug doesn't match or the requested season has changed, re-render the episode selector
			if (currentShow !== data.title_slug || data.season !== currentSeason) {
				this.setContent(
					'selectorEpisodeList',
					episodeTemplate,
					showCache[data.title_slug].
						then(VideoLibrary.getEpisodes).
						then(function(episodes) {
							return {
								"episodes" : _.where(episodes, { season : currentSeason }),
							};
						})
				);
			}

			currentShow = data.title_slug;
			if (data.season) {
				currentSeason = data.season;
			}

			this.$node.show();
		};

		this.after('initialize', function() {
			this.on('show', this.show);
			this.activateOn(document, 'viewEpisodes');
		});
	}
});
