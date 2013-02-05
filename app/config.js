require.config({
	shim : {
		"underscore" : {
			exports : '_',
		},
	},
	paths : {
		"hbs" : "components/require-handlebars-plugin/hbs",
		"underscore" : "components/underscore/underscore",
		"handlebars" : "components/require-handlebars-plugin/Handlebars",
		"i18nprecompile" : "components/require-handlebars-plugin/hbs/i18nprecompile",
		"json2" : "components/require-handlebars-plugin/hbs/json2",

		"crossroads" : "components/crossroads.js/dist/crossroads",
		"signals" : "components/js-signals/dist/signals",
	},
	packages : [
		{
			"name"     : "when",
			"location" : "components/when",
			"main"     : "debug",
		},
	],
	hbs : {
		disableI18n: true,
		helperPathCallback : function(name) {
			return 'js/filters/' + name;
		},
		templateExtension : "html",
	},
});
require(
[
	'js/routes',
	'js/components/remote',
	'js/components/now-playing',
	'js/components/movieviewer',
	'js/components/tvshowviewer',
	'js/components/episodeviewer',
	'js/components/videodetails',
],
function(router, remote, nowPlaying, movieViewer, tvShowViewer, episodeViewer, detailsViewer) {
	remote.attachTo('#remote');
	nowPlaying.attachTo('#now-playing');
	movieViewer.attachTo('#movies');
	tvShowViewer.attachTo("#tv-shows");
	episodeViewer.attachTo("#episodes");
	detailsViewer.attachTo("#video-details");

	$(window).trigger('hashchange');
});
