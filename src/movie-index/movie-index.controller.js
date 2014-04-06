"use strict";

require('angular');

angular.module('minimc.movieIndex').controller('MovieIndexCtrl', [
  '$scope',
  function($scope) {
    $scope.movies = [];
  }]);
