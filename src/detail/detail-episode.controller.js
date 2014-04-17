"use strict";

module.exports = function EpisodeDetailCtrl($scope, $routeParams, tvshows) {
  $scope.currentSeason = parseInt($routeParams.season, 10);
  $scope.currentEpisode = parseInt($routeParams.episode, 10);

  tvshows.getShowBySlug($routeParams.showSlug)
    .then(tvshows.getEpisodes)
    .then(function(episodes) {
      var episodeIndex = 0;
      for (var len = episodes.length; episodeIndex < len; episodeIndex++) {
        if (episodes[episodeIndex].getSeason() === $scope.currentSeason &&
            episodes[episodeIndex].getEpisode() === $scope.currentEpisode) {
          break;
        }
      }

      $scope.previousEpisode = episodes[episodeIndex - 1] || null;
      $scope.currentEpisode = episodes[episodeIndex] || null;
      $scope.nextEpisode = episodes[episodeIndex + 1] || null;
    });

};

module.exports.$inject = ['$scope', '$routeParams', 'tvshows'];
