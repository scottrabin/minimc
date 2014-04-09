"use strict";

require('angular');

module.exports = angular.module('minimc.xbmc', [])
  .constant('movieProperties', ["title", "genre", "year", "rating", "director",
                                "trailer", "tagline", "plot", "plotoutline",
                                "originaltitle", "lastplayed", "playcount",
                                "writer", "studio", "mpaa", "cast", "country",
                                "imdbnumber", "runtime", "set", "showlink",
                                "streamdetails", "top250", "votes", "fanart",
                                "thumbnail", "file", "sorttitle", "resume",
                                "setid", "dateadded", "tag", "art"])
  .service('xbmc', require('./xbmc.service'))
  .service('movies', require('./xbmc.movies.service'));
