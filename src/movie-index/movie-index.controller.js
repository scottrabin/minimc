"use strict";

module.exports = function MovieIndexCtrl($scope, movies) {
  $scope.movies = movies;
};

module.exports.$inject = ['$scope', 'movies'];

module.exports.resolve = {
  movies: ['movies', function(movies) {
    return movies.getMovies();
  }]
};
