'use strict';

define(
[
	'handlebars',
],
function(Handlebars) {

	function thumbnail_path(context, options) {
		return context;
	}

	Handlebars.registerHelper( 'thumbnail_path', thumbnail_path );

	return thumbnail_path;
});
