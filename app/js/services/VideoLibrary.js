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
	var VideoLibraryService = {},
		// internal cache variables
		movies, tvshows, seasons, episodes;

	VideoLibraryService.clearCache = function() {
		movies   = null;
		tvshows  = null;
		seasons  = {};
		episodes = {};
	};

	VideoLibraryService.getMovies = function() {
		// cache the movies
		if (!movies) {
			movies = XbmcRpc.VideoLibrary.GetMovies(VIDEO_FIELDS_MOVIE).then(function(results) {
				return results.movies;
			});
		}
		return movies;
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
		if (!tvshows) {
			tvshows = XbmcRpc.VideoLibrary.GetTVShows(VIDEO_FIELDS_TVSHOW).then(function(results) {
				return results.tvshows;
			});
		}
		return tvshows;
	};

	VideoLibraryService.getShowSeasons = function(tv_show) {
		if (!seasons[tv_show.tvshowid]) {
			seasons[tv_show.tvshowid] = XbmcRpc.VideoLibrary.GetSeasons(tv_show.tvshowid, VIDEO_FIELDS_SEASON).then(function(results) {
				return results.seasons;
			});
		}
		return seasons[tv_show.tvshowid];
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

	VideoLibraryService.getEpisodes = function(tv_show) {
		if (!episodes[tv_show.tvshowid]) {
			episodes[tv_show.tvshowid] = XbmcRpc.VideoLibrary.GetEpisodes(tv_show.tvshowid, null, VIDEO_FIELDS_EPISODE).then(function(results) {
				return results.episodes;
			});
		}
		return episodes[tv_show.tvshowid];
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

	// Initialize the cache
	VideoLibraryService.clearCache();

	return VideoLibraryService;

});
