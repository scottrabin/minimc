"use strict";

require('angular');
require('angular-route');

var fs = require('fs');

module.exports = angular.module('minimc.detail', [
  'ngRoute'
])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/movies/:movieSlug', {
      template: fs.readFileSync(__dirname + '/detail-movie.html'),
      controller: require('./detail.controller')
    });
  }]);
