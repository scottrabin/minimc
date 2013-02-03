'use strict';

define(
[
	'handlebars',
],
function(Handlebars) {

	function querystring(str) {
		return encodeURIComponent(str);
	}

	Handlebars.registerHelper( 'querystring', querystring );

	return querystring;
});
