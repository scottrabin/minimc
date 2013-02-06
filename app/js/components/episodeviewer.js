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
		var currentShow, currentSeason,
			seasons, episodes;

		this.defaultAttrs({
			"selectorSeasonList" : ".season-selector",
			"selectorEpisodeList" : ".episode-selector",
		});

		this.show = function(event, data) {
			// if the title slug doesn't match, reset the season and episode data
			if (currentShow !== data.title_slug) {
				var show = VideoLibrary.getShowFromSlug(data.title_slug);
				seasons  = show.then(VideoLibrary.getShowSeasons);
				episodes = show.then(VideoLibrary.getEpisodes);
				currentShow   = data.title_slug;
				currentSeason = null;

				this.setContent(
					'selectorSeasonList',
					seasonTemplate,
					seasons.then(function(seasons) {
						return {
							"seasons"       : seasons,
							"currentSeason" : currentSeason,
						};
					})
				);
			}
			// if the title slug doesn't match or the requested season has changed, re-render the episode selector
			if (data.season !== currentSeason) {
				currentSeason = data.season || 1;
				this.setContent(
					'selectorEpisodeList',
					episodeTemplate,
					episodes.then(function(episodes) {
						return {
							"episodes" : _.where(episodes, { season : currentSeason }),
						};
					})
				);
			}

			this.$node.show();
		};

		this.after('initialize', function() {
			this.on('show', this.show);
			this.activateOn(document, 'viewEpisodes');
		});
	}
});
