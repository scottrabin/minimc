"use strict";

define(
[
	'js/services/XbmcRpc',
	'js/filters/slug',
],
function(XbmcRpc, slugFilter) {

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

	VideoLibraryService.getShowSeasons = function(tv_show) {
		return XbmcRpc.VideoLibrary.GetSeasons(tv_show.tvshowid, VIDEO_FIELDS_SEASON).then(function(results) {
			return results.seasons;
		});
	};

	VideoLibraryService.getShowFromSlug = function(showSlug) {
		// TODO - Cache this? Store it locally and query against a map? Or is the use
		// case generally low enough latency that this isn't really a problem?
		return VideoLibraryService.getShows().then(function(shows) {
			for (var i = 0 ; i < shows.length ; i++) {
				if (showSlug === slugFilter(shows[i].title)) {
					return shows[i];
				}
			}
			throw "Could not find TV show matching slug [ " + showSlug + " ]";
		});
	};

	VideoLibraryService.getEpisodeBySeasonEpisode = function(show, season, episode) {
		return VideoLibraryService.getEpisodes(show).then(function(episodeList) {
			for(var i = 0 ; i < episodeList.length ; i++) {
				if (episodeList[i].season === season && episodeList[i].episode === episode) {
					return episodeList[i];
				}
			}
			throw "Could not find episode S" + season + "E" + episode + " of " + show.title;
		});
	}

	VideoLibraryService.getEpisodes = function(tv_show) {
		return XbmcRpc.VideoLibrary.GetEpisodes(tv_show.tvshowid, null, VIDEO_FIELDS_EPISODE).then(function(results) {
			return results.episodes;
		});
	};

	return VideoLibraryService;

});
