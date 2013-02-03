'use strict';

define(
[
	'when',
],
function(when) {
	return {
		post : function(url, parameters) {
			return when( $.ajax(url, {
				"contentType" : "application/json;charset=UTF-8",
				"type" : "POST",
				"data" : JSON.stringify(parameters),
			}) );
		},
	}
});
