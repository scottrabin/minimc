"use strict";

require('angular');

module.exports = angular.module('minimc.tvshowIndex', [])
  .directive('mcTvshow', require('./tvshow.directive'));
