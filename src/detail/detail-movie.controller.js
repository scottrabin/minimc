"use strict";

module.exports = function DetailCtrl($scope, movie) {
  $scope.movie = movie;
};

module.exports.$inject = ['$scope', 'movie'];

module.exports.resolve = {
  movie: ['$stateParams', 'movies', function($stateParams, movies) {
    return movies.getMovieBySlug($stateParams.movieSlug);
  }]
};
