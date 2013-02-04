'use strict';

define(
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'when',
	'underscore',
	'js/utility/showLoading',
	'hbs!views/episodes/seasons',
	'hbs!views/episodes/episodes',
],
function(defineComponent, VideoLibrary, when, _, showLoading, seasonTemplate, episodeTemplate) {

	return defineComponent(episodeViewer);

	function episodeViewer() {
		var showCache = {};
		var currentShow, currentSeason = 1;

		this.defaultAttrs({
			"selectorSeasonList" : ".season-selector",
			"selectorEpisodeList" : ".episode-selector",
		});

		this.after('initialize', function() {

			this.on('show', function(event, data) {
				var self = this;
				if (!showCache[data.title_slug]) {
					showCache[data.title_slug] = VideoLibrary.getShowFromSlug(data.title_slug);
				}

				// if the title slug doesn't match, re-render the season selector
				if (currentShow !== data.title_slug) {
					showLoading(this.select('selectorSeasonList'));
					showCache[data.title_slug].
						then(VideoLibrary.getShowSeasons).
						then(function(seasons) {
							self.select('selectorSeasonList').html( seasonTemplate({
								seasons       : seasons,
								currentSeason : currentSeason,
							}) );
						});
				}
				// if the title slug doesn't match or the requested season has changed, re-render the episode selector
				if (currentShow !== data.title_slug || data.season !== currentSeason) {
					showLoading(this.select('selectorEpisodeList'));
					showCache[data.title_slug].
						then(VideoLibrary.getEpisodes).
						then(function(episodes) {
							self.select('selectorEpisodeList').html( episodeTemplate({
								episodes : _.where(episodes, {season : currentSeason}),
							}) );
						});
				}

				currentShow = data.title_slug;
				if (data.season) {
					currentSeason = data.season;
				}

				this.$node.show();
			});
			this.on('hide', function() {
				this.$node.hide();
			});
		});
	}
});
