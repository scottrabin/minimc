'use strict';

define(
[
], function() {
	return function(videoItem) {
		// XBMC does not have 'movieid' as a valid return field in Player.GetItem
		// Determine the type, the hard way
		return (
			videoItem.hasOwnProperty('type') ? videoItem.type :
			videoItem.hasOwnProperty('movieid') ? 'movie' :
			videoItem.hasOwnProperty('tvshowid') && videoItem.tvshowid > 0 ? 'episode' :
			null
		);
	};
});
