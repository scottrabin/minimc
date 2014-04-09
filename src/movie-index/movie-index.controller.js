"use strict";

module.exports = function MovieIndexCtrl($scope, movies) {
  movies.fetch().then(function(mvs) {
    $scope.movies = mvs;
  });
};

module.exports.$inject = ['$scope', 'movies'];
