"use strict";

describe('services', function() {

	describe('XbmcRpc', function() {
		var XbmcRpcService;

		beforeEach(inject(function(XbmcRpc) {
			XbmcRpcService = XbmcRpc;
		}));

		describe('VideoLibrary', function() {
			describe('#getMovies', function() {
				it("should send the correct method to the server", function() {
					JsonRpc.expect('VideoLibrary.GetMovies').respond( jsonrpcSuccess({ movies : [] }) );

					XbmcRpcService.VideoLibrary.GetMovies();

					JsonRpc.respond();
				});
			});
		});
	});
});
