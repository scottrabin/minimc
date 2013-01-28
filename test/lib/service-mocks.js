window.jasmine && (function(win) {

	window.JsonRpc = (function() {
		var mock = {};

		mock.respondWith = function(data) {
			mock.$httpBackend.expectPOST('/jsonrpc').respond(200, {
				"jsonrpc" : "2.0",
				"results" : data,
			});
		};

		mock.respond = function() {
			mock.$httpBackend.flush();
		};

		return mock;
	})();

})(window);
