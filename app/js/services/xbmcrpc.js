'use strict';

define(
[
	'js/services/Ajax',
],
function(Ajax) {
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
		return Ajax.post('/jsonrpc?' + command, {
			"id"      : id++,
			"jsonrpc" : "2.0",
			"method"  : command,
			"params"  : params,
		}).then(function(response) {
			// TODO - Does XBMC really return *both* of these? JSON-RPC says it should be singular...
			if (response.hasOwnProperty('result')) {
				return response.result;
			} else if (response.hasOwnProperty('results')) {
				return response.results;
			} else {
				throw "JSON-RPC Failed (method : " + command + ")" + JSON.stringify(response);
			}
		});
	}

	return {
		Input : {
			/**
			 * 5.4.2 Input.Down - Navigate down in GUI
			 * http://TODO
			 *
			 * @returns {RpcPromise}
			 */
			Down : function() {
				return sendCommand('Input.Down', null);
			},
			/**
			 * 5.4.4 Input.Left - Navigate left in GUI
			 * http://TODO
			 *
			 * @returns {RpcPromise}
			 */
			Left : function() {
				return sendCommand('Input.Left', null);
			},
			/**
			 * 5.4.5 Input.Right - Navigate right in GUI
			 * http://TODO
			 *
			 * @returns {RpcPromise}
			 */
			Right : function() {
				return sendCommand('Input.Right', null);
			},
			/**
			 * 5.4.6 Input.Select - Select current item in GUI
			 * http://TODO
			 *
			 * @returns {RpcPromise}
			 */
			Select : function() {
				return sendCommand('Input.Select', null);
			},
			/**
			 * 5.4.7 Input.Up - Navigate up in GUI
			 * http://TODO
			 *
			 * @returns {RpcPromise}
			 */
			Up : function() {
				return sendCommand('Input.Up', null);
			},
		},
		Player : {
			getActivePlayers : function() {
				return sendCommand('Player.GetActivePlayers', null);
			},
			/**
			 * 5.6.2 Player.GetItem - Retrieves the currently played item
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v4#Player.GetItem
			 *
			 * @param {Player.Id} playerid
			 * @param {List.Fields.All} properties
			 * @return {RpcPromise}
			 */
			GetItem : function(playerid, properties) {
				return sendCommand('Player.GetItem', {
					"playerid"   : playerid,
					"properties" : (Array.isArray(properties) ? properties : [properties]),
				})
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
			/**
			 * 5.6.20 Player.Stop - Stops playback
			 * http://TODO
			 *
			 * @param {Player.Id} playerid
			 * @returns {RpcPromise}
			 */
			Stop : function(playerid) {
				return sendCommand('Player.Stop', {
					"playerid" : playerid,
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

});
