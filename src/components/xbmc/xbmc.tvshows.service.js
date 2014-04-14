"use strict";

var TVShow = require('../../minimc/tvshow');
var compare = require('../../util/compare');

module.exports = function TvShowService(xbmc, tvShowProperties) {
  return {
    fetch: function() {
      return xbmc('VideoLibrary.GetTVShows', {
        cache: true,
        data: {
          properties: tvShowProperties
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
    },
    get: function(slug) {
      return this.fetch().then(function(shows) {
        return shows[slug] || null;
      });
    }
  };
};

module.exports.$inject = ['xbmc', 'tvShowProperties'];
