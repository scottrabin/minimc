"use strict";

var Movie = require('../../minimc/movie');
var compare = require('../../util/compare');

module.exports = function XbmcMovieService(xbmc, movieProperties) {
  return {
    fetch: function() {
      return xbmc('VideoLibrary.GetMovies', {
        properties: movieProperties
      }).then(function(response) {
        return response.data.result.movies
          .map(Movie.create)
          .sort(function(a, b) {
            return compare.string(a.getTitle(), b.getTitle());
          });
      });
    }
  };
};

module.exports.$inject = ['xbmc', 'movieProperties'];
