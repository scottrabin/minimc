"use strict";

require('angular');

module.exports = angular.module('minimc.movieIndex', [])
  .directive('mcMovie', require('./movie.directive'));
