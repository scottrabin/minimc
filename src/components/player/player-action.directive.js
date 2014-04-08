"use strict";

require('angular');

angular.module('minimc')
  .directive('mcPlayerAction', function() {
    return {
      restrict: 'A',
      compile: function(tElement, tAttrs) {
        // Prevent buttons from doing anything other than the defined action
        tElement.attr('type', 'button');
      }
    };
  });
