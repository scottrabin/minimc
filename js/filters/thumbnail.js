'use strict';

WeXBMC.filter('thumbnail', function() {
	return function(source) {
		return 'vfs/' + encodeURI(source);
	};
});
