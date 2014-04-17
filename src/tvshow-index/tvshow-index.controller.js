"use strict";

module.exports = function TvShowIndexCtrl($scope, tvshows) {
  $scope.tvshows = tvshows;
};

module.exports.$inject = ['$scope', 'tvshows'];

module.exports.resolve = {
  tvshows: ['tvshows', function(tvshows) {
    return tvshows.getTVShows();
  }]
};
