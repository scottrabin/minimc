window.jasmine && (function(win) {

	window.JsonRpc = (function() {
		var mock = {},
			id;

		mock.respondWith = function(data) {
			mock.$httpBackend.expectPOST('/jsonrpc').respond(200, {
				"jsonrpc" : "2.0",
				"results" : data,
			});
		};

		mock.expect = function(method, params) {
			var request = {
				"id"      : id++,
				"jsonrpc" : "2.0",
				"method"  : method,
				"params"  : params || {},
			};
			return mock.$httpBackend.expectPOST('/jsonrpc', request);
		};

		mock.respond = function() {
			mock.$httpBackend.flush();
		};

		mock.reset = function() {
			id = 0;
		};

		return mock;
	})();

	window.result = (function() {
		var mock = {};

		mock.capture = function(val) {
			mock.value = val;
		};

		return mock;
	})();

	beforeEach(module('wexbmc'));

	beforeEach(function() {
		this.addMatchers({
			toEqualData : function(expected) {
				return angular.equals(this.actual, expected);
			},
		});
	});

	beforeEach(inject(function($injector) {
		JsonRpc.$httpBackend = $injector.get('$httpBackend');
		JsonRpc.reset();
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
