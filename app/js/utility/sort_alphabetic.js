'use strict';

define(
[
], function() {

	return function(property) {
		return function(a, b) {
			var aLower = a[property].toLowerCase(),
				bLower = b[property].toLowerCase();

			return (aLower < bLower ? -1 : aLower > bLower ? 1 : 0);
		};
	};
});
