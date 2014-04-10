"use strict";

module.exports = function McCastList() {
  return {
    restrict: 'E',
    scope: {
      "cast": '='
    },
    template: require('fs').readFileSync(__dirname + '/castlist.directive.html', 'utf8')
  };
};
