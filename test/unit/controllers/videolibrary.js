"use strict";

describe('controllers', function() {

	describe('VideoLibraryCtrl', function() {
		var scope, ctrl;

		beforeEach(inject(function($rootScope, $controller) {

			JsonRpc.respondWith( { movies : [
				{ movieid : 1, label : 'First Movie' },
				{ movieid : 2, label : 'Second Movie' },
			]});

			scope = $rootScope.$new();
			ctrl = $controller(VideoLibraryCtrl, { $scope : scope });
		}));

		it("should create a `movies` model with 2 movies fetched via JSON-RPC", function() {
			scope.movies.then(result.capture);
			JsonRpc.respond();

			expect(result.value).toEqualData([
				{ movieid : 1, label : 'First Movie' },
				{ movieid : 2, label : 'Second Movie' },
			]);
		});
	});

});
