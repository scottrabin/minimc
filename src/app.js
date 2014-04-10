"use strict";

// core libs
require('angular');
require('angular-route');

// define the main application module
angular.module('minimc', [
  'ngRoute',
  require('./components/xbmc').name,
  require('./detail').name,
  require('./movie-index').name,
  require('./remote').name
])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/remote'});
}]);

// generic dependencies
require('./components/player/player-action.directive');
