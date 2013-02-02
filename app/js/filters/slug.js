'use strict';

WeXBMC.filter('slug', function() {
	return function(str) {
		return str.
			// lower case
			toLowerCase().
			// yank years
			replace(/\[\d{4}\]/, '').
			replace(/\(\d{4}\)/, '').
			// turn everything *not* a letter or number into a dash
			replace(/[^a-z0-9]+/g, '-').
			// trim leading/trailing dashes
			replace(/^-+|-+$/g, '');
	};
});
