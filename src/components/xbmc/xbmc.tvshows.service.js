"use strict";

module.exports = function TvShowService(xbmc, TVShow, Season, Episode, compare) {
  var cache = {
    tvshows: null,
    seasons: {},
    episodes: {}
  };

  return {
    getShowBySlug: function(slug) {
      return this.getTVShows().then(function(shows) {
        return shows[slug] || null;
      });
    },
    getTVShows: function() {
      if (!cache.tvshows) {
        cache.tvshows = xbmc('VideoLibrary.GetTVShows', {
          data: {
            properties: TVShow.XBMC_PROPERTIES
          }
        }).then(function(response) {
          return response.data.result.tvshows
            .map(TVShow.create)
            .sort(function(a, b) {
              return compare.string(a.getTitle(), b.getTitle());
            })
            .reduce(function(t, show) {
              t[show.getSlug()] = show;
              return t;
            }, {});
        });
      }
      return cache.tvshows;
    },
    getSeasons: function(tvshow) {
      if (!cache.seasons[tvshow.getSlug()]) {
        cache.seasons[tvshow.getSlug()] = xbmc('VideoLibrary.GetSeasons', {
          data: {
            tvshowid: tvshow.getId(),
            properties: Season.XBMC_PROPERTIES
          }
        }).then(function(response) {
          return response.data.result.seasons
            .map(function(season) {
              return new Season(tvshow, season);
            })
            .sort(function(a, b) {
              return a.getSeason() - b.getSeason();
            });
        });
      }

      return cache.seasons[tvshow.getSlug()]
    },
    getEpisodes: function(tvshow) {
      if (!cache.episodes[tvshow.getSlug()]) {
        cache.episodes[tvshow.getSlug()] = xbmc('VideoLibrary.GetEpisodes', {
          data: {
            properties: Episode.XBMC_PROPERTIES
          }
        }).then(function(response) {
          return response.data.result.episodes
            .map(function(episode) {
              return Episode.create(tvshow, episode);
            })
            .sort(function(a, b) {
              var seasonDiff = a.getSeason() - b.getSeason();
              if (seasonDiff !== 0) {
                return seasonDiff;
              } else {
                return a.getEpisode() - b.getEpisode();
              }
            });
        });
      }

      return cache.episodes[tvshow.getSlug()];
    }
  };
};

module.exports.$inject = ['xbmc', 'TVShow', 'Season', 'Episode', 'compare'];
