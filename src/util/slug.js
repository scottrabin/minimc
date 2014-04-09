"use strict";

module.exports = function toSlug(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-');
};
