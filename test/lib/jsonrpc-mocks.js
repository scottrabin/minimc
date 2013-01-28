window.jasmine && (function(win) {

	window.jsonrpcSuccess = function(data) {
		return {
			"jsonrpc" : "2.0",
			"results" : data,
		};
	};

})(window);
