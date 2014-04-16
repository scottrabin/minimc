"use strict";

module.exports = function EpisodeIndexCtrl($scope, $routeParams, tvshows) {
  $scope.currentSeason = ($routeParams.hasOwnProperty('season') ?
                          parseInt($routeParams.season, 10) :
                          1);

  tvshows.getShowBySlug($routeParams.showSlug).then(function(tvshow) {
    $scope.tvshow = tvshow;

    tvshows.getSeasons(tvshow).then(function(seasons) {
      $scope.seasons = seasons;

      if (!$routeParams.hasOwnProperty('season') && seasons.length > 0) {
        $scope.currentSeason = seasons[0].getSeason();
      }
    });

    tvshows.getEpisodes(tvshow).then(function(episodes) {
      $scope.episodes = episodes;
    });
  });
};

module.exports.$inject = ['$scope', '$routeParams', 'tvshows'];
