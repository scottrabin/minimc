"use strict";

module.exports = function DetailCtrl($scope, $routeParams, movies) {
  movies.getMovieBySlug($routeParams.movieSlug).then(function(movie) {
    $scope.movie = movie;
  })
};

module.exports.$inject = ['$scope', '$routeParams', 'movies'];
