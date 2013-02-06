'use strict';

define(
[
	'handlebars',
	'js/filters/slug',
	'js/filters/lpad',
],
function(Handlebars, slug, lpad) {

	function itemLink(videoItem) {
		return (
			videoItem.hasOwnProperty('tvshowid') ? '#/tv-shows/' + slug(videoItem.showtitle) + '/S' + lpad(videoItem.season, 2) + 'E' + lpad(videoItem.episode, 2) + '/' + slug(videoItem.title) :
			videoItem.hasOwnProperty('movieid')  ? '#/movies/' + slug(videoItem.title) :
			'#/UNKNOWN_TYPE'
		);
	};

	Handlebars.registerHelper( 'itemLink', itemLink );

	return itemLink;
});
