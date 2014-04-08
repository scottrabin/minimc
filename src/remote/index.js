"use strict";

require('angular');
require('angular-route');

var fs = require('fs');

module.exports = angular.module('minimc.remote', [
  'ngRoute'
])
  .controller('RemoteCtrl', require('./remote.controller'))
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/remote', {
      template: fs.readFileSync(__dirname + '/remote.html'),
      controller: 'RemoteCtrl'
    });
  }]);
