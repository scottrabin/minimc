'use strict';

define(
[
	'handlebars',
	'js/filters/lpad',
],
function(Handlebars, lpad) {

	function formatTime(time) {
		var str = [];
		if (time.hours) {
			str.push(time.hours);
		}
		str.push( lpad(time.minutes, 2) );
		str.push( lpad(time.seconds, 2) );

		return str.join(':');
	};

	Handlebars.registerHelper( 'formatTime', formatTime );

	return formatTime;
});
