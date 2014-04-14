"use strict";

var fs = require('fs');

module.exports = function TvShowDirective() {
  return {
    restrict: 'E',
    template: fs.readFileSync(__dirname + '/tvshow.directive.html'),
    compile: function(tElement, attrs) {
      tElement.addClass('tvshow');
    }
  };
};
