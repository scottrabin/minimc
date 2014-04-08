"use strict";

var fs = require('fs');

module.exports = function() {
  return {
    restrict: 'E',
    template: require('fs').readFileSync(__dirname + '/movie.directive.html')
  };
};
