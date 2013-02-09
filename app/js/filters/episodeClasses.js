'use strict';

define(
[
	'handlebars',
],
function(Handlebars) {

	function episodeClasses(episode) {
		var classes = [];

		if (episode.lastplayed) {
			classes.push("watched");
		}

		// TODO - add a "resume" class

		return classes.join(' ');
	}

	Handlebars.registerHelper( 'episodeClasses', episodeClasses );

	return episodeClasses;
});
