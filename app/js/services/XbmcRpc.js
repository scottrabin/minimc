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
			 * 5.6.1 Input.Back - Goes back in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Back
			 *
			 * @returns {RpcPromise}
			 */
			Back : function() {
				return sendCommand('Input.Back', null);
			},
			/**
			 * 5.6.2 Input.ContextMenu - Shows the context menu
			 *
			 * @returns {RpcPromise}
			 */
			ContextMenu : function() {
				return sendCommand('Input.ContextMenu', null);
			},
			/**
			 * 5.6.3 Input.Down - Navigate down in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Down
			 *
			 * @returns {RpcPromise}
			 */
			Down : function() {
				return sendCommand('Input.Down', null);
			},
			/**
			 * 5.6.4 Input.ExecuteAction - Execute a specific action
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.ExecuteAction
			 *
			 * @param {Input.Action} action
			 * @returns {RpcPromise}
			 */
			ExecuteAction : function(action) {
				return sendCommand('Input.ExecuteAction', {
					"action" : action,
				});
			},
			/**
			 * 5.6.5 Input.Home - Goes to home window in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Home
			 *
			 * @returns {RpcPromise}
			 */
			Home : function() {
				return sendCommand('Input.Home', null);
			},
			/**
			 * 5.6.7 Input.Left - Navigate left in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Left
			 *
			 * @returns {RpcPromise}
			 */
			Left : function() {
				return sendCommand('Input.Left', null);
			},
			/**
			 * 5.6.8 Input.Right - Navigate right in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Right
			 *
			 * @returns {RpcPromise}
			 */
			Right : function() {
				return sendCommand('Input.Right', null);
			},
			/**
			 * 5.6.9 Input.Select - Select current item in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Select
			 *
			 * @returns {RpcPromise}
			 */
			Select : function() {
				return sendCommand('Input.Select', null);
			},
			/**
			 * 5.6.12 Input.ShowOSD - Show the on-screen display for the current player
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.ShowOSD
			 *
			 * @returns {RpcPromise}
			 */
			ShowOSD : function() {
				return sendCommand('Input.ShowOSD', null);
			},
			/**
			 * 5.6.13 Input.Up - Navigate up in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Up
			 *
			 * @returns {RpcPromise}
			 */
			Up : function() {
				return sendCommand('Input.Up', null);
			},
		},
		Player : {
			/**
			 * 5.9.1 Player.GetActivePlayers - Returns all active players
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.GetActivePlayers
			 *
			 * @returns {RpcPromise}
			 */
			GetActivePlayers : function() {
				return sendCommand('Player.GetActivePlayers', null);
			},
			/**
			 * 5.9.2 Player.GetItem - Retrieves the currently played item
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.GetItem
			 *
			 * @param {Player.Id} playerid
			 * @param {List.Fields.All} properties
			 * @returns {RpcPromise}
			 */
			GetItem : function(playerid, properties) {
				return sendCommand('Player.GetItem', {
					"playerid"   : playerid,
					"properties" : (Array.isArray(properties) ? properties : [properties]),
				})
			},
			/**
			 * 5.9.3 Player.GetProperties - Retrieves the values of the given properties
			 *
			 * @param {Player.Id} playerid
			 * @param {Array.<Player.Property.Name>} properties
			 * @returns {RpcPromise}
			 */
			GetProperties : function(playerid, properties) {
				return sendCommand('Player.GetProperties', {
					"playerid"   : playerid,
					"properties" : (properties ? (Array.isArray(properties) ? properties : [properties]) : null),
				});
			},
			/**
			 * 5.9.6 Player.Open - Start playback of either the playlist with the given ID,
			 *                     a slideshow with the pictures from the given directory or
			 *                     a single file or an item from the database.
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.Open
			 *
			 * @param {*=} item
			 * @param {object=} options
			 * @returns {RpcPromise}
			 */
			// TODO - it would appear the mapping from arguments to rpc method properties is not enforced
			Open : function(item) {
				return sendCommand('Player.Open', item);
			},
			/**
			 * 5.9.7 Player.PlayPause - Pauses or unpause playback and returns the new state
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.PlayPause
			 *
			 * @param {Player.Id} playerid
			 * @param {Global.Toggle} play [default: "toggle"]
			 * @returns {RpcPromise}
			 */
			PlayPause : function(playerid) {
				return sendCommand('Player.PlayPause', {
					"playerid" : playerid,
				});
			},
			/**
			 * 5.9.14 Player.SetSpeed - Set the speed of the current playback
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.SetSpeed
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
			 * 5.9.15 Player.SetSubtitle - Set the subtitle displayed by the player
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.SetSubtitle
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
			 * 5.9.16 Player.Stop - Stops playback
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.Stop
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
			 * 5.12.4 VideoLibrary.GetEpisodes - Retrieve all tv show episodes
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#VideoLibrary.GetEpisodes
			 *
			 * @param {Library.Id=} tvshowid
			 * @param {Number=} season
			 * @param {Array.<Video.Fields.Episode>=} properties
			 * @param {List.Limits=} limits
			 * @param {List.Sort=} sort
			 * @param {*} filter
			 * @returns {RpcPromise}
			 */
			GetEpisodes : function(tvshowid, season, properties, limits, sort, filter) {
				return sendCommand('VideoLibrary.GetEpisodes', {
					"tvshowid"   : tvshowid,
					"season"     : (season === null ? _undef : season),
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
					"filter"     : filter,
				});
			},
			/**
			 * 5.12.9 VideoLibrary.GetMovies - Retrieve all movies
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#VideoLibrary.GetMovies
			 *
			 * @param {Array.<Video.Fields.Movie>=} properties
			 * @param {List.Limits=} limits
			 * @param {List.Sort=} sort
			 * @param {*} filter
			 * @return {RpcPromise}
			 */
			GetMovies : function(properties, limits, sort, filter) {
				return sendCommand('VideoLibrary.GetMovies', {
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
					"filter"     : filter,
				});
			},
			/**
			 * 5.12.15 VideoLibrary.GetSeasons
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#VideoLibrary.GetSeasons
			 *
			 * @param {Library.Id} tvshowid
			 * @param {Array.<Video.Fields.Season>=} properties
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
			 * 5.12.17 VideoLibrary.GetTVShows - Retrieve all tv shows
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#VideoLibrary.GetTVShows
			 *
			 * @param {Array.<Video.Fields.TVShow>=} properties
			 * @param {List.Limits} limits
			 * @param {List.Sort} sort
			 * @param {*} filter
			 * @returns {RpcPromise}
			 */
			GetTVShows : function(properties, limits, sort, filter) {
				return sendCommand('VideoLibrary.GetTVShows', {
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
					"filter"     : filter,
				});
			},
		},
	};

});
