"use strict";

module.exports = function EpisodeDetailCtrl($scope, tvshow, episodes, currentSeason, currentEpisode) {
  var episodeIndex = 0;
  for (var len = episodes.length; episodeIndex < len; episodeIndex++) {
    if (episodes[episodeIndex].getSeason() === currentSeason &&
        episodes[episodeIndex].getEpisode() === currentEpisode) {
      break;
    }
  }

  $scope.currentSeason = currentSeason;
  $scope.currentEpisode = currentEpisode;
  $scope.previousEpisode = episodes[episodeIndex - 1] || null;
  $scope.currentEpisode = episodes[episodeIndex] || null;
  $scope.nextEpisode = episodes[episodeIndex + 1] || null;
};

module.exports.$inject = ['$scope', 'tvshow', 'episodes', 'currentSeason', 'currentEpisode'];

module.exports.resolve = {
  tvshow: ['tvshows', '$stateParams', function(tvshows, $stateParams) {
    return tvshows.getShowBySlug($stateParams.showSlug);
  }],
  episodes: ['tvshows', 'tvshow', function(tvshows, tvshow) {
    return tvshows.getEpisodes(tvshow);
  }],
  currentSeason: ['$stateParams', function($stateParams) {
    return parseInt($stateParams.season, 10);
  }],
  currentEpisode: ['$stateParams', function($stateParams) {
    return parseInt($stateParams.episode, 10);
  }]
};
