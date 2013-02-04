'use strict';

define([
	'components/flight/lib/advice',
], function(advice) {
	return function(selector) {
		$(selector).html('loading...');
	};
	/*
	return function(selector, base) {
		return advice.before(base, function() {
			$(selector).html('loading...');
		});
	}
   */
});
