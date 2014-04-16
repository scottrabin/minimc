"use strict";

var fs = require('fs');

angular.module('minimc')
  .config(['$provide', function($provide) {
    $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
  }])
  .run(['$httpBackend', '$http', function($httpBackend, $http) {
    // These files are not committed in the repository because who knows
    // who might issue a takedown response for some copyright claims
    var responses = {
      "VideoLibrary.GetTVShows": fs.readFileSync(__dirname + '/VideoLibrary.GetTVShows.json', 'utf8'),
      "VideoLibrary.GetSeasons": fs.readFileSync(__dirname + '/VideoLibrary.GetSeasons.json', 'utf8'),
      "VideoLibrary.GetEpisodes": fs.readFileSync(__dirname + '/VideoLibrary.GetEpisodes.json', 'utf8'),
      "VideoLibrary.GetMovies": fs.readFileSync(__dirname + '/VideoLibrary.GetMovies.json', 'utf8')
    };
    // pass through all GET requests to any source files
    $httpBackend.when("GET", /src/).passThrough();
    // inspect the jsonrpc calls to return the correct data
    $httpBackend.when("POST", /jsonrpc.*/).respond(function(method, url, data, headers) {
      var p = angular.fromJson(data);
      return [200, responses[p.method], {}, 'OK'];
    });
  }]);
