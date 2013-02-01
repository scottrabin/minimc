"use strict";

WeXBMC.factory('VideoLibrary', ['XbmcRpc', function(XbmcRpc) {

	var VIDEO_PROPERTY_NAMES = [
		"title",
		"genre",
		"year",
		"rating",
		"director",
		"trailer",
		"tagline",
		"plot",
		"plotoutline",
		"originaltitle",
		"lastplayed",
		"playcount",
		"writer",
		"studio",
		"mpaa",
		"cast",
		"country",
		"imdbnumber",
		"premiered",
		"productioncode",
		"runtime",
		"set",
		"showlink",
		"streamdetails",
		"top250",
		"votes",
		"fanart",
		"thumbnail",
		"file",
		"sorttitle",
		"resume",
		"setid"
	];
	var VIDEO_FIELDS_TVSHOW = [
		"title",
		"genre",
		"year",
		"rating",
		"plot",
		"studio",
		"mpaa",
		"cast",
		"playcount",
		"episode",
		"imdbnumber",
		"premiered",
		"votes",
		"lastplayed",
		"fanart",
		"thumbnail",
		"file",
		"originaltitle",
		"sorttitle",
		"episodeguide"
	];
	var VIDEO_FIELDS_SEASON = [
		"season",
		"showtitle",
		"playcount",
		"episode",
		"fanart",
		"thumbnail",
		"tvshowid"
	];
	var VideoLibraryService = {};

	VideoLibraryService.getMovies = function() {
		return XbmcRpc.VideoLibrary.GetMovies(VIDEO_PROPERTY_NAMES).then(function(results) {
			return results.movies;
		});
	};

	VideoLibraryService.getShows = function() {
		return XbmcRpc.VideoLibrary.GetTVShows(VIDEO_FIELDS_TVSHOW).then(function(results) {
			return results.tvshows;
		});
	};

	return VideoLibraryService;
}]);
