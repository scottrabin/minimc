"use strict";

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
