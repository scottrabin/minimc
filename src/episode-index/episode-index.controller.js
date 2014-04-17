"use strict";

function getSeason(stateParam, seasons) {
  var seasonMatch = stateParam && stateParam.match(/\/S([0-9]+)/);
  return (seasonMatch ? parseInt(seasonMatch[1], 10) : seasons[0].getSeason());
}

module.exports = function EpisodeIndexCtrl($rootScope, $scope, tvshow, seasons, episodes, currentSeason) {
  $scope.tvshow = tvshow;
  $scope.seasons = seasons;
  $scope.episodes = episodes;
  $scope.currentSeason = currentSeason;

  // Because there's no reason to reload the view & controller if just the
  // season changes
  var destroyHandle = $rootScope.$on(
    '$stateChangeStart',
    function interceptStateParamChange(event, toState, toParams, fromState, fromParams) {
      if (
        toState.name === fromState.name &&
        toParams.showSlug === fromParams.showSlug &&
        toParams.identifier !== fromParams.identifier
      ) {
        event.preventDefault();
        $scope.currentSeason = getSeason(toParams.identifier);
      }
    });
  $scope.$on('$destroy', destroyHandle);
};

module.exports.$inject = ['$rootScope', '$scope', 'tvshow', 'seasons', 'episodes', 'currentSeason'];

module.exports.resolve = {
  tvshow: ['$stateParams', 'tvshows', function($stateParams, tvshows) {
    return tvshows.getShowBySlug($stateParams.showSlug);
  }],
  seasons: ['tvshows', 'tvshow', function(tvshows, tvshow) {
    return tvshows.getSeasons(tvshow);
  }],
  episodes: ['tvshows', 'tvshow', function(tvshows, tvshow) {
    return tvshows.getEpisodes(tvshow);
  }],
  currentSeason: ['$stateParams', 'seasons', function($stateParams, seasons) {
    return getSeason($stateParams.season, seasons);
  }]
};
