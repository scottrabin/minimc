"use strict";

// core libs
require('angular');
require('angular-route');

// subsections
var remoteSection = require('./remote');
var movieIndexSection = require('./movie-index');

// define the main application module
angular.module('minimc', [
  'ngRoute',
  'minimc.movieIndex',
  'minimc.remote'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/remote'});
  $routeProvider.when('/remote', remoteSection.routes.DEFAULT);
  $routeProvider.when('/movies', movieIndexSection.routes.DEFAULT);
}]);

// generic dependencies
require('./components/player/player-action.directive');
require('./components/permalink/permalink.filter');
require('./components/slug/slug.filter');
