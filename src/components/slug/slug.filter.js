"use strict";

require('angular');

angular.module('minimc')
.service('slug', function() {
  return function(str) {
    return str.toLowerCase().trim().
      replace(/[^a-z0-9-]/g, '-').
      replace(/-{2,}/g, '-');
  };
})
.filter('slug', ['slug', function(slug) {
  return slug;
}]);
