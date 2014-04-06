"use strict";

require('angular');
require('../slug/slug.filter');

angular.module('minimc').filter('permalink', ['slug', function(slug) {
  return function(item) {
    if (item.movieid > -1) {
      return "#/movies/" + slug(item.title);
    }

    return "#/remote";
  };
}]);
