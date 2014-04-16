"use strict";

var fs = require('fs');

angular.module('minimc')
  .config(['$provide', function($provide) {
    // use a fake backend, configured in the .run block below
    $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
    // use a different artwork filter in dev mode
    $provide.decorator('artworkFilter', [function() {
      return function DevModeArtworkFilter(path) {
        return path ? decodeURIComponent(path.slice(8, -1)) : null;
      }
    }]);
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
      var response = responses[p.method];
      if (p.params.properties) {
        var json = angular.fromJson(responses[p.method]);
        var subpropName = Object.getOwnPropertyNames(json.result).filter(function(v) { return v !== 'limits'; })[0];
        json.result[subpropName] = json.result[subpropName].map(function(v) {
          return p.params.properties.reduce(function(r, prop) {
            r[prop] = v[prop];
            return r;
          }, {});
        });
        response = angular.toJson(json);
      }
      return [200, response, {}, 'OK'];
    });
  }]);
