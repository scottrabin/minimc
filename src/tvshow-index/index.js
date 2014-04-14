"use strict";

require('angular');
require('angular-route');

var fs = require('fs');

module.exports = angular.module('minimc.tvshowIndex', [
  require('../components/xbmc').name
])
  .directive('mcTvshow', require('./tvshow.directive'))
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/tv-shows', {
      template: fs.readFileSync(__dirname + '/tvshow-index.html'),
      controller: require('./tvshow-index.controller')
    })
  }]);
