'use strict';

define(
[
	'handlebars',
	'js/filters/slug',
	'js/filters/lpad',
	'js/utility/video_type',
],
function(Handlebars, slug, lpad, videoType) {

	function itemLink(videoItem) {
		switch(videoType(videoItem)) {
			case 'movie' :
				return '#/movies/' + slug(videoItem.title);
			case 'episode' :
				return '#/tv-shows/' + slug(videoItem.showtitle) + '/S' + lpad(videoItem.season, 2) + 'E' + lpad(videoItem.episode, 2) + '/' + slug(videoItem.title);
			default :
				return '#/UNKNOWN_TYPE';
		}
	};

	Handlebars.registerHelper( 'itemLink', itemLink );

	return itemLink;
});
