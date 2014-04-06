"use strict";

require('./movie-index.module');
require('./movie.directive');
require('./movie-index.controller');

var fs = require('fs');

exports.routes = {
  DEFAULT: {
    template: fs.readFileSync(__dirname + '/movie-index.html'),
    controller: 'MovieIndexCtrl'
  }
};
