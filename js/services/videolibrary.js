"use strict";

WeXBMC.factory('VideoLibrary', ['XbmcRpc', function(XbmcRpc) {

	var VideoLibraryService = {};

	VideoLibraryService.getMovies = function() {
		return XbmcRpc.VideoLibrary.GetMovies().then(function(results) {
			return results.movies;
		});
	};

	return VideoLibraryService;
}]);
