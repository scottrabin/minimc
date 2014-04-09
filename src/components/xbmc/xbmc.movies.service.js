"use strict";

var Movie = require('../../minimc/movie');

module.exports = function XbmcMovieService(xbmc, movieProperties) {
  return {
    fetch: function() {
      return xbmc('VideoLibrary.GetMovies', {
        properties: movieProperties
      }).then(function(response) {
        return response.data.result.movies.map(Movie.create);
      });
    }
  };
};

module.exports.$inject = ['xbmc', 'movieProperties'];
