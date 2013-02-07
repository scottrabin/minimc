'use strict';

define(
[
	'handlebars',
	'js/filters/slug',
	'js/filters/lpad',
],
function(Handlebars, slug, lpad) {

	function get_type(videoItem) {
		// XBMC does not have 'movieid' as a valid return field in Player.GetItem
		// Determine the type, the hard way
		return (
			videoItem.hasOwnProperty('type') ? videoItem.type :
			videoItem.hasOwnProperty('movieid') ? 'movie' :
			videoItem.hasOwnProperty('tvshowid') && videoItem.tvshowid > 0 ? 'tvshow' :
			null
		);
	}

	function itemLink(videoItem) {
		switch(get_type(videoItem)) {
			case 'movie' :
				return '#/movies/' + slug(videoItem.title);
			case 'tvshow' :
				return '#/tv-shows/' + slug(videoItem.showtitle) + '/S' + lpad(videoItem.season, 2) + 'E' + lpad(videoItem.episode, 2) + '/' + slug(videoItem.title);
			default :
				return '#/UNKNOWN_TYPE';
		}
	};

	Handlebars.registerHelper( 'itemLink', itemLink );

	return itemLink;
});
