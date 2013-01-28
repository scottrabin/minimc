WeXBMC.factory('XbmcRpc', ['$http', function($http) {
	var id = 0;

	function sendCommand(command, params) {
		return $http.post('/jsonrpc', {
			"id"      : id++,
			"jsonrpc" : "2.0",
			"method"  : command,
			"params"  : params || {},
		});
	}

	return {
		getMovies : function() { sendCommand('VideoLibrary.GetMovies'); },
	};
}]);
