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
	var VideoLibraryService = {};

	VideoLibraryService.getMovies = function() {
		return XbmcRpc.VideoLibrary.GetMovies(VIDEO_PROPERTY_NAMES).then(function(results) {
			return results.movies;
		});
	};

	return VideoLibraryService;
}]);
