WeXBMC.factory('XbmcRpc', ['$http', function($http) {
	var id = 0;

	function sendCommand(command, params) {
		return $http.post('/jsonrpc', {
			"id"      : id++,
			"jsonrpc" : "2.0",
			"method"  : command,
			"params"  : params || {},
		}).then(function(response) {
			if (response.data.results) {
				return response.data.results;
			} else {
				throw "JSON-RPC Failed (method : " + command + ")" + JSON.stringify(response.data);
			}
		});
	}

	return {
		getMovies : function() {
			return sendCommand('VideoLibrary.GetMovies', null).then(function(response) {
				return response.movies;
			});
		},
	};
}]);
