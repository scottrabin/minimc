'use strict';

define(
[
	'crossroads',
],
function(crossroads) {

	function go_to(hash) {
		return function() {
			window.location.hash = hash;
		}
	}

	function trigger_event(eventName) {
		return function() {
			$(document).trigger(eventName);
		}
	}

	crossroads.addRoute('/', go_to('/movies') );
	crossroads.addRoute('/movies', trigger_event('viewMovies') );
	crossroads.addRoute('/tv-shows', trigger_event('viewTVShows') );

	// TODO - Find a better router
	$(window).on('hashchange', function(event) {
		crossroads.parse(window.location.hash.substr(1));
	});
});
