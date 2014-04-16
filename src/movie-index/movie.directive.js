"use strict";

var fs = require('fs');

module.exports = function McMovieDirective() {
  return {
    restrict: 'E',
    template: fs.readFileSync(__dirname + '/movie.directive.html', 'utf8'),
    compile: function(tElement, attrs) {
      tElement.addClass('movie');
    }
  };
};
