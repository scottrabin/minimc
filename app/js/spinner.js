'use strict';

define([
], function() {
	var spinner = $('#spinner'),
		count = 0,
		api = {};

	api.show = function(promise) {
		count++;
		spinner.show();
		return promise.always(api.hide);
	};

	api.hide = function(v) {
		if (--count === 0) {
			spinner.hide();
		}
		return v;
	};

	return api;
});
