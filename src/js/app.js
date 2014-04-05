'use strict';

require('angular');
require('angular-route');

var fs = require('fs');

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {template: fs.readFileSync(__dirname + '/../partials/partial1.html'), controller: 'MyCtrl1'});
  $routeProvider.when('/view2', {template: fs.readFileSync(__dirname + '/../partials/partial2.html'), controller: 'MyCtrl2'});
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);
