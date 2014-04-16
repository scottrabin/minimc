"use strict";

module.exports = function XbmcMovieService(xbmc, Movie, compare) {
  var cache = {
    movies: null
  };

  return {
    getMovieBySlug: function(slug) {
      return this.getMovies().then(function(movies) {
        return movies[slug] || null;
      });
    },
    getMovies: function() {
      if (!cache.movies) {
        cache.movies = xbmc('VideoLibrary.GetMovies', {
          cache: true,
          data: {
            properties: Movie.XBMC_PROPERTIES
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
      }

      return cache.movies;
    }
  };
};

module.exports.$inject = ['xbmc', 'Movie', 'compare'];
