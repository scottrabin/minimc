"use strict";

describe('services', function() {

	var MOVIES = [
		{ movieid : 1, label : "First Movie" },
		{ movieid : 2, label : "Second Movie" },
	];

	describe('VideoLibrary', function() {
		var VideoLibraryService;

		beforeEach(inject(function(VideoLibrary) {
			VideoLibraryService = VideoLibrary;
		}));

		describe('#getMovies()', function() {
			it("should return a list of movies", function() {
				JsonRpc.respondWith( { movies : MOVIES } );

				VideoLibraryService.getMovies().then(result.capture);
				JsonRpc.respond();

				expect(result.value).toEqualData( MOVIES );
			});
		});
	});
});
