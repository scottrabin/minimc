"use strict";

module.exports = function TvShowIndexCtrl($scope, tvshows) {
  tvshows.getTVShows().then(function(shows) {
    $scope.tvshows = shows;
  });
};

module.exports.$inject = ['$scope', 'tvshows'];
