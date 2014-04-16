"use strict";

module.exports = function CompareFactory() {
  var exports = {};

  /**
   * Compare strings
   *
   * @param {String} a
   * @param {String} b
   * @return Number
   */
  exports.string = function(a, b) {
    return (a < b ? -1 :
            a > b ? 1 :
            0);
  };

  return exports;
};

module.exports.$inject = [];
