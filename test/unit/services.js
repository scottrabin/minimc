"use strict";

describe('services', function() {

	beforeEach(module('wexbmc'));

	describe('XbmcRpc', function() {
		var $httpBackend, XbmcRpcService;

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
				}).respond(200);

				XbmcRpcService.getMovies();
			});
		});
	});
});
