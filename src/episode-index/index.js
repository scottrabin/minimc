"use strict";

require('angular');
require('angular-route');

var fs = require('fs');

module.exports = angular.module('minimc.episodeIndex', [
  require('../components/xbmc').name
])
  .config(['$routeProvider', function($routeProvider) {
    var episodeIndex = {
      template: fs.readFileSync(__dirname + '/episode-index.html', 'utf8'),
      controller: require('./episode-index.controller')
    };

    $routeProvider.when('/tv-shows/:showSlug', episodeIndex);
    $routeProvider.when('/tv-shows/:showSlug/S:season?', episodeIndex);
  }]);
