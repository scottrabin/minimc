"use strict";

// core libs
require('angular');
require('angular-route');

// subsections
var remoteSection = require('./remote');

// define the main application module
angular.module('minimc', [
  'ngRoute',
  'minimc.remote'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/remote'});
  $routeProvider.when('/remote', remoteSection.routes.DEFAULT);
}]);

// generic dependencies
require('./components/player-action/player-action.directive');
