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

	beforeEach(module('wexbmc'));
	beforeEach(inject(function($injector) {
		JsonRpc.$httpBackend = $injector.get('$httpBackend');
	}));

	afterEach(function() {
		if (JsonRpc.$httpBackend) {
			JsonRpc.$httpBackend.verifyNoOutstandingRequest();
		}
	});

	function getCurrentSpec() {
		return jasmine.getEnv().currentSpec;
	}

})(window);
