"use strict";

require('angular');

angular.module('minimc.movieIndex').directive('mcMovie', function() {
  return {
    restrict: 'E',
    template: require('fs').readFileSync(__dirname + '/movie.directive.html')
  };
});
