"use strict";

define(
[
	'js/services/XbmcRpc',
],
function(XbmcRpc) {

	var InputService = {};

	var DIRECTION_COMMAND_MAP = {
		"left" : "Left",
		"up"   : "Up",
		"down" : "Down",
		"right" : "Right",
	};

	InputService.move = function(direction) {
		return XbmcRpc.Input[ DIRECTION_COMMAND_MAP[direction] ]();
	};

	InputService.select = function() {
		return XbmcRpc.Input.Select();
	};

	InputService.home = XbmcRpc.Input.Home;
	InputService.back = XbmcRpc.Input.Back;
	InputService.menu = XbmcRpc.Input.ShowOSD;

	return InputService;
});
