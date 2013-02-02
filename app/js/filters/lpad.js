'use strict';

define(
[
	'handlebars',
],
function(Handlebars) {

	function lpad(number, length) {
		while((''+number).length < length && (number = '0' + number));

		return number;
	}

	Handlebars.registerHelper( 'lpad', lpad );

	return lpad;
});
