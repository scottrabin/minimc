"use strict";

var Movie = require('../../minimc/movie');
var compare = require('../../util/compare');

module.exports = function XbmcMovieService(xbmc, movieProperties) {
  return {
    fetch: function() {
      return xbmc('VideoLibrary.GetMovies', {
        cache: true,
        data: {
          properties: movieProperties
        }
      }).then(function(response) {
        return response.data.result.movies
          .map(Movie.create)
          .sort(function(a, b) {
            return compare.string(a.getTitle(), b.getTitle());
          })
          .reduce(function(m, movie) {
            m[movie.getSlug()] = movie;
            return m;
          }, {});
      });
    },
    get: function(slug) {
      return this.fetch().then(function(movies) {
        return movies[slug] || null;
      });
    }
  };
};

module.exports.$inject = ['xbmc', 'movieProperties'];
