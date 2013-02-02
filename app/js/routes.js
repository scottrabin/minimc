'use strict';

define(
[
	'crossroads',
	'underscore',
],
function(crossroads, _) {

	function go_to(hash) {
		return function() {
			window.location.hash = hash;
		}
	}

	/**
	 * Helper function for mapping trigger arguments to a hash via an array of key names
	 */
	function parameter_map_array(memo, paramName, index) {
		memo[paramName] = this[index];
		return memo;
	}

	/**
	 * Helper function for mapping trigger arguments to a hash via getter functions
	 */
	function parameter_map_object(memo, getter, paramName) {
		memo[paramName] = getter(this);
		return memo;
	}

	function trigger_event(eventName, parameterMap) {
		return function() {
			var args = arguments;
			if (parameterMap) {
				args = _.reduce(
					parameterMap,
					_.isArray(parameterMap) ? parameter_map_array : parameter_map_object,
					{},
					args
				);
			}
			$(document).trigger(eventName, args);
		}
	}

	crossroads.addRoute('/', go_to('/movies') );
	crossroads.addRoute('/movies', trigger_event('viewMovies') );
	crossroads.addRoute('/tv-shows', trigger_event('viewTVShows') );
	crossroads.addRoute('/tv-shows/{title_slug}',
						trigger_event('viewEpisodes', ['title_slug'])
					   );
	crossroads.addRoute(/tv-shows\/([^/]+)\/S(\d{2})/,
						trigger_event('viewEpisodes', {
							"title_slug" : function(args) { return args[0]; },
							"season"     : function(args) { return parseInt(args[1], 10); },
						})
					   );

	// TODO - Find a better router
	$(window).on('hashchange', function(event) {
		crossroads.parse(window.location.hash.substr(1));
	});
});
