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
		this.defaultAttrs({
			"selectorSeasonList"  : ".season-selector",
			"selectorSeasons"     : ".season-selector li",
			"selectorEpisodeList" : ".episode-selector",
			"selectorEpisodes"    : ".episode-selector li",
		});

		this.fetchSeasons = function(tvshow) {
			return this.setContent('selectorSeasonList', seasonTemplate, tvshow.then(VideoLibrary.getShowSeasons));
		};

		this.fetchEpisodes = function(tvshow) {
			return this.setContent('selectorEpisodeList', episodeTemplate, tvshow.then(VideoLibrary.getEpisodes));
		};

		this.show = function(event, data) {
			// if the title slug doesn't match, reset the season and episode data
			if (this.currentShow !== data.title_slug) {
				var tvshow       = VideoLibrary.getShowFromSlug(data.title_slug);

				this.currentShow = data.title_slug;
				this.seasons     = this.fetchSeasons(tvshow);
				this.episodes    = this.fetchEpisodes(tvshow);

				this.trigger('view.change.tvshow.id', tvshow);
			}

			this.trigger('view.change.tvshow.season', data.season || 1);
		};

		this.setActiveSeason = function(event, season) {
			this.selectAfter('selectorSeasons', this.seasons).
				spread(function(elems) {
					elems.removeClass('active').
						filter('[data-season="' + season + '"]').
							addClass('active');
				});
		};

		this.filterEpisodeList = function(event, season) {
			this.selectAfter('selectorEpisodes', this.episodes).
				spread(function(elems) {
					elems.each(function() {
						$(this).toggle( $(this).data('season') == season );
					});
				});
		};

		this.after('initialize', function() {
			this.on('view.change.tvshow.season', this.setActiveSeason);
			this.on('view.change.tvshow.season', this.filterEpisodeList);

			this.on('show', this.show);
			this.activateOn(document, 'viewEpisodes');
		});
	}
});
