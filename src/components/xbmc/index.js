"use strict";

require('angular');

module.exports = angular.module('minimc.xbmc', [])
  .filter('artwork', require('./xbmc.artwork.filter'))

  .service('xbmc', require('./xbmc.service'))
  .service('movies', require('./xbmc.movies.service'))
  .service('tvshows', require('./xbmc.tvshows.service'))

  .factory('Actor', require('./model/actor'))
  .factory('Movie', require('./model/movie'))
  .factory('TVShow', require('./model/tvshow'))
  .factory('Season', require('./model/season'))
  .factory('Episode', require('./model/episode'));
