"use strict";

require('angular-route');

var fs = require('fs');

module.exports = function($routeProvider) {
  // movies index
  $routeProvider.when('/movies', {
    template: fs.readFileSync(__dirname + '/movie-index/movie-index.html', 'utf8'),
    controller: require('./movie-index/movie-index.controller')
  });

  // movie detail
  $routeProvider.when('/movies/:movieSlug', {
    template: fs.readFileSync(__dirname + '/detail/detail-movie.html', 'utf8'),
    controller: require('./detail/detail.controller')
  });

  // tvshow index
  $routeProvider.when('/tv-shows', {
    template: fs.readFileSync(__dirname + '/tvshow-index/tvshow-index.html', 'utf8'),
    controller: require('./tvshow-index/tvshow-index.controller')
  });

  // episode detail
  $routeProvider.when('/tv-shows/:showSlug/S:season?E:episode', {
    template: fs.readFileSync(__dirname + '/detail/detail-episode.html', 'utf8'),
    controller: require('./detail/detail-episode.controller')
  });

  // episodes index
  var episodeIndex = {
    template: fs.readFileSync(__dirname + '/episode-index/episode-index.html', 'utf8'),
    controller: require('./episode-index/episode-index.controller')
  };
  $routeProvider.when('/tv-shows/:showSlug', episodeIndex);
  $routeProvider.when('/tv-shows/:showSlug/S:season', episodeIndex);

  // remote
  $routeProvider.when('/remote', {
    template: fs.readFileSync(__dirname + '/remote/remote.html', 'utf8'),
    controller: require('./remote/remote.controller')
  });

  // anything else, just show the remote
  $routeProvider.otherwise({redirectTo: '/remote'});
};

module.exports.$inject = ['$routeProvider'];
