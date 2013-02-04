"use strict";

define(
[
	'js/services/XbmcRpc',
	'js/filters/slug',
	'js/services/types/video.fields.movie',
	'js/services/types/video.fields.tvshow',
	'js/services/types/video.fields.season',
	'js/services/types/video.fields.episode',
],
function(XbmcRpc, slugFilter, VIDEO_FIELDS_MOVIE, VIDEO_FIELDS_TVSHOW, VIDEO_FIELDS_SEASON, VIDEO_FIELDS_EPISODE) {
	var VideoLibraryService = {};

	VideoLibraryService.getMovies = function() {
		return XbmcRpc.VideoLibrary.GetMovies(VIDEO_FIELDS_MOVIE).then(function(results) {
			return results.movies;
		});
	};

	VideoLibraryService.getMovieFromSlug = function(movieSlug) {
		return VideoLibraryService.getMovies().
			then(function(movies) {
				for (var i = 0; i < movies.length ; i++) {
					if (movieSlug === slugFilter(movies[i].title)) {
						return movies[i]
					}
				}
				throw "Could not find movie matching slug [ " + movieSlug + " ]";
			});
	}

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
