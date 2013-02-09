'use strict';

define(
[
], function() {

	var features = {};

	function feature_supported(featureName, test) {
		var ok = !!(test || (typeof test == 'function' && test()));

		$('html').
			toggleClass( featureName, ok ).
			toggleClass( 'no-' + featureName, !ok);

		features[featureName] = ok;
	}

	feature_supported('touch', 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch);
	// sort of a "duh" moment, but basically to yank the "no-js" class on <html>
	feature_supported('js', true);

	return features;
});
