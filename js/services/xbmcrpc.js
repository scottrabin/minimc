WeXBMC.factory('XbmcRpc', ['$http', function($http) {
	var id = 0;

	function sendCommand(command, params) {
		return $http.post('/jsonrpc', {
			"id"      : id++,
			"jsonrpc" : "2.0",
			"method"  : command,
			"params"  : params || {},
		}).then(function(response) {
			// TODO - Does XBMC really return *both* of these? JSON-RPC says it should be singular...
			if (response.data.hasOwnProperty('result')) {
				return response.data.result;
			} else if (response.data.hasOwnProperty('results')) {
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
		Player : {
			getActivePlayers : function() {
				return sendCommand('Player.GetActivePlayers', null);
			},
			GetProperties : function(playerId, properties) {
				return sendCommand('Player.GetProperties', {
					"playerid"   : playerId,
					"properties" : (Array.isArray(properties) ? properties : [properties]),
				});
			},
			PlayPause : function(playerId) {
				return sendCommand('Player.PlayPause', { "playerid" : playerId });
			},
		},
	};
}]);
