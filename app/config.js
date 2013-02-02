require.config({
	paths : {
		"hbs" : "components/require-handlebars-plugin/hbs",
		"underscore" : "components/require-handlebars-plugin/hbs/underscore",
		"handlebars" : "components/require-handlebars-plugin/Handlebars",
		"i18nprecompile" : "components/require-handlebars-plugin/hbs/i18nprecompile",
		"json2" : "components/require-handlebars-plugin/hbs/json2",

		"crossroads" : "components/crossroads.js/dist/crossroads",
		"signals" : "components/js-signals/dist/signals",
	},
	hbs : {
		disableI18n: true,
		helperPathCallback : function(name) {
			return 'js/filters/' + name;
		},
		templateExtension : "html",
	},
});
