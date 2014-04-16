"use strict";

module.exports = function ArtworkFactory() {
  return function XbmcArtworkFilter(path) {
    return (path
            ? '/vfs/' + encodeURI(path)
            : null);
  };
};

module.exports.$inject = [];
