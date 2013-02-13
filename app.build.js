({
  baseUrl : "./app/",
  optimize : "none",

  pragmasOnSave: {
    excludeHbsParser : true,
    excludeHbs: true,
    excludeAfterBuild: true
  },
  inlineText : true,

  packages : [
    {
      "name"     : "when",
      "location" : "components/when",
      "main"     : "when",
    },
  ],

  wrap : true,
  useStrict : true,
  mainConfigFile : "./app/config.js",
  include : "config",
  name : "components/almond/almond",
})
