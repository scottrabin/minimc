"use strict";

require('angular');
require('angular-route');

var fs = require('fs');

module.exports = angular.module('minimc.movieIndex', [
  require('../components/xbmc').name
])
  .directive('mcMovie', require('./movie.directive'))
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/movies', {
      template: fs.readFileSync(__dirname + '/movie-index.html'),
      controller: require('./movie-index.controller')
    });
  }]);
