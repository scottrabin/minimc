'use strict';

define(
[
	'handlebars',
],
function(Handlebars) {

	function slug(str) {
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

	Handlebars.registerHelper( 'slug', slug );

	return slug;
});
