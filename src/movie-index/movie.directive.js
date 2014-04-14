"use strict";

var fs = require('fs');

module.exports = function McMovieDirective() {
  return {
    restrict: 'E',
    template: require('fs').readFileSync(__dirname + '/movie.directive.html'),
    compile: function(tElement, attrs) {
      tElement.addClass('movie');
    }
  };
};
