"use strict";

module.exports = function DetailCtrl($scope, $routeParams, movies) {
  movies.get($routeParams.movieSlug).then(function(movie) {
    $scope.movie = movie;
  })
};

module.exports.$inject = ['$scope', '$routeParams', 'movies'];
