"use strict";

WeXBMC.factory('VideoLibrary', ['XbmcRpc', '$filter', function(XbmcRpc, $filter) {

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
	var VIDEO_FIELDS_EPISODE = [
		"title",
		"plot",
		"votes",
		"rating",
		"writer",
		"firstaired",
		"playcount",
		"runtime",
		"director",
		"productioncode",
		"season",
		"episode",
		"originaltitle",
		"showtitle",
		"cast",
		"streamdetails",
		"lastplayed",
		"fanart",
		"thumbnail",
		"file",
		"resume",
		"tvshowid"
	];
	var __slugMap = {};

	var VideoLibraryService = {};

	VideoLibraryService.getMovies = function() {
		return XbmcRpc.VideoLibrary.GetMovies(VIDEO_PROPERTY_NAMES).then(function(results) {
			return results.movies;
		});
	};

	VideoLibraryService.getShows = function() {
		return XbmcRpc.VideoLibrary.GetTVShows(VIDEO_FIELDS_TVSHOW).then(function(results) {
			for(var i = 0, l = results.tvshows.length ; i < l; i++) {
				__slugMap[ $filter('slug')(results.tvshows[i].title) ] = results.tvshows[i];
			}
			return results.tvshows;
		});
	};

	VideoLibraryService.getShowSeasons = function(tv_show) {
		return XbmcRpc.VideoLibrary.GetSeasons(tv_show.tvshowid, VIDEO_FIELDS_SEASON).then(function(results) {
			return results.seasons;
		});
	};

	VideoLibraryService.getShowFromSlug = function(showSlug) {
		return __slugMap[showSlug];
	};

	VideoLibraryService.getEpisodes = function(tv_show) {
		return XbmcRpc.VideoLibrary.GetEpisodes(tv_show.tvshowid, null, VIDEO_FIELDS_EPISODE).then(function(results) {
			return results.episodes;
		});
	};

	return VideoLibraryService;
}]);
