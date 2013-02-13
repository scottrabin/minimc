'use strict';

define(
[
	'when',
], function(when) {

	return {
		post : function(command, data) {
			console.log(command, data);
			return when(true);
		}
	};
});
