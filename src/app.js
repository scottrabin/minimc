"use strict";

// core libs
require('angular');
require('angular-ui-router');

// define the main application module
angular.module('minimc', [
  'ui.router',
  require('./components/xbmc').name,
  require('./movie-index').name,
  require('./tvshow-index').name,
])
.filter('encodeURIComponent', [function() {
  return encodeURIComponent;
}])
.filter('slug', require('./components/filters/slug.filter'))
.filter('pad', require('./components/filters/pad.filter'))
.factory('compare', require('./components/filters/compare.filter'))
.directive('mcCastList', require('./components/castlist/castlist.directive'))
.config(require('./routes'));

// generic dependencies
require('./components/player/player-action.directive');
