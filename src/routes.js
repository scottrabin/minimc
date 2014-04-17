"use strict";

var fs = require('fs');

module.exports = function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/remote');

  $stateProvider.state('remote', {
    url: "/remote",
    template: fs.readFileSync(__dirname + '/remote/remote.html', 'utf8'),
    controller: require('./remote/remote.controller')
  });

  $stateProvider.state('movie-index', {
    url: "/movies",
    template: fs.readFileSync(__dirname + '/movie-index/movie-index.html', 'utf8'),
    controller: require('./movie-index/movie-index.controller'),
    resolve: require('./movie-index/movie-index.controller').resolve
  });

  $stateProvider.state('movie-detail', {
    url: "/movies/{movieSlug}",
    template: fs.readFileSync(__dirname + '/detail/detail-movie.html', 'utf8'),
    controller: require('./detail/detail-movie.controller'),
    resolve: require('./detail/detail-movie.controller').resolve
  });

  $stateProvider.state('tvshow-index', {
    url: "/tv-shows",
    template: fs.readFileSync(__dirname + '/tvshow-index/tvshow-index.html', 'utf8'),
    controller: require('./tvshow-index/tvshow-index.controller'),
    resolve: require('./tvshow-index/tvshow-index.controller').resolve
  });

  $stateProvider.state('episode-index', {
    url: "/tv-shows/{showSlug}{identifier:(?:/S[0-9]+)?}",
    template: fs.readFileSync(__dirname + '/episode-index/episode-index.html', 'utf8'),
    controller: require('./episode-index/episode-index.controller'),
    resolve: require('./episode-index/episode-index.controller').resolve
  });

  $stateProvider.state('episode-detail', {
    url: "/tv-shows/{showSlug}/S{season:[0-9]+}E{episode:[0-9]+}",
    template: fs.readFileSync(__dirname + '/detail/detail-episode.html', 'utf8'),
    controller: require('./detail/detail-episode.controller'),
    resolve: require('./detail/detail-episode.controller').resolve
  });
};

module.exports.$inject = ['$stateProvider', '$urlRouterProvider'];
