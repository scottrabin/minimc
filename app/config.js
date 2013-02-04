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
	'js/components/videoviewer',
	'js/components/now-playing'
],
function(router, remote, videoViewer, nowPlaying) {
	remote.attachTo('#remote');
	videoViewer.attachTo('#video-library');
	nowPlaying.attachTo('#now-playing');

	$(window).trigger('hashchange');
});
