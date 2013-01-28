"use strict";

describe('services', function() {

	beforeEach(function() {
		this.addMatchers({
			toEqualData : function(expected) {
				return angular.equals(this.actual, expected);
			},
		});
	});

	describe('XbmcRpc', function() {
		var $httpBackend, XbmcRpcService,
			results,
			captureResult = function(result) {
				results = result;
			};

		beforeEach(inject(function(_$httpBackend_, XbmcRpc) {
			$httpBackend = _$httpBackend_;
			XbmcRpcService = XbmcRpc;
		}));

		describe('getMovies', function() {
			it('should send an HTTP POST request to get the list of movies', function() {
				$httpBackend.expectPOST('/jsonrpc', {
					"id"      : 0,
					"jsonrpc" : "2.0",
					"method"  : "VideoLibrary.GetMovies",
					"params"  : {},
				}).respond(200, jsonrpcSuccess({
					"movies" : [],
				}));

				XbmcRpcService.getMovies();
				$httpBackend.flush();
			});

			it('should access the `movies` property from the return payload and return it as an array', function() {
				$httpBackend.expectPOST('/jsonrpc').respond(200, jsonrpcSuccess({
					"movies" : [
						{
							"movieid" : 1,
							"label" : "First Movie",
						},
						{
							"movieid" : 2,
							"label"   : "Second Movie",
						}
					],
					"limits" : {
						"start" : 0,
						"end"   : 2,
						"total" : 2,
					}
				}));

				XbmcRpcService.getMovies().then(captureResult);
				$httpBackend.flush();

				expect(results).toEqualData([
					{ movieid : 1, label : "First Movie" },
					{ movieid : 2, label : "Second Movie" },
				]);
			});
		});
	});
});
