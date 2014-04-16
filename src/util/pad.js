"use strict";

module.exports = function pad(num, size) {
  var numStr = "" + num;

  return (Array(size - numStr.length + 1).join('0')) + numStr;
};
