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
			Open : function(item) {
				return sendCommand('Player.Open', item);
			},
			PlayPause : function(playerId) {
				return sendCommand('Player.PlayPause', { "playerid" : playerId });
			},
		},
		VideoLibrary : {
			GetMovies : function(properties, limits, sort) {
				var request = {};
				if (properties) {
					request.properties = properties;
				}
				if (limits) {
					request.limits = limits;
				}
				if (sort) {
					request.sort = sort;
				}
				return sendCommand('VideoLibrary.GetMovies', request);
			},
		},
	};
}]);
