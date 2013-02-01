WeXBMC.factory('XbmcRpc', ['$http', function($http) {
	var id = 0;
	var _undef;

	function sendCommand(command, params) {
		// filter params to remove any undefined values
		if (!params) { params = {}; }
		for (var parameter in params) {
			if (params[parameter] === _undef) {
				delete params[parameter];
			}
		}
		return $http.post('/jsonrpc', {
			"id"      : id++,
			"jsonrpc" : "2.0",
			"method"  : command,
			"params"  : params,
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
			/**
			 * 5.6.17 Player.SetSpeed - Set the speed of the current playback
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v4#Player.SetSpeed
			 *
			 * @param {Player.Id} playerid
			 * @param {*} speed
			 * @returns {RpcPromise}
			 */
			SetSpeed : function(playerid, speed) {
				return sendCommand('Player.SetSpeed', {
					"playerid" : playerid,
					"speed"    : speed,
				});
			},
			/**
			 * 5.6.18 Player.SetSubtitle - Set the subtitle displayed by the player
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v4#Player.SetSubtitle
			 *
			 * @param {Player.Id} playerid
			 * @param {*} subtitle
			 * @returns {RpcPromise}
			 */
			SetSubtitle : function(playerid, subtitle) {
				return sendCommand('Player.SetSubtitle', {
					"playerid" : playerid,
					"subtitle" : subtitle,
				});
			},
		},
		VideoLibrary : {
			/**
			 * 5.9.4 VideoLibrary.GetEpisodes - Retrieve all tv show episodes
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v4#VideoLibrary.GetEpisodes
			 *
			 * @param {Library.Id=} tvshowid
			 * @param {Number=} season
			 * @param {Video.Fields.Episode=} properties
			 * @param {List.Limits=} limits
			 * @param {List.Sort=} sort
			 * @returns {RpcPromise}
			 */
			GetEpisodes : function(tvshowid, season, properties, limits, sort) {
				return sendCommand('VideoLibrary.GetEpisodes', {
					"tvshowid"   : tvshowid || -1,
					"season"     : _undef,
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
				});
			},
			/**
			 * 5.9.9 VideoLibrary.GetMovies - Retrieve all movies
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v4#VideoLibrary.GetMovies
			 */
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
			/**
			 * 5.9.15 VideoLibrary.GetSeasons
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v4#VideoLibrary.GetSeasons
			 *
			 * @param {Library.Id} tvshowid
			 * @param {Video.Fields.Season=} properties
			 * @param {List.Limits=} limits
			 * @param {List.Sort=} sort
			 * @returns {RpcPromise}
			 */
			GetSeasons : function(tvshowid, properties, limits, sort) {
				return sendCommand('VideoLibrary.GetSeasons', {
					"tvshowid"   : tvshowid,
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
				});
			},
			/**
			 * 5.9.17 VideoLibrary.GetTVShows
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v4#VideoLibrary.GetTVShows
			 */
			GetTVShows : function(properties, limits, sort) {
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
				return sendCommand('VideoLibrary.GetTVShows', request);
			},
		},
	};
}]);
