require('./remote.module.js');
require('./remote.controller.js');

var fs = require('fs');

exports.routes = {
  DEFAULT: {
    template: fs.readFileSync(__dirname + '/remote.html'),
    controller: 'RemoteCtrl'
  }
};
