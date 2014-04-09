"use strict";

var rpcCount = 0;

module.exports = function XbmcService($http) {
  return function sendXbmcRpc(command, data) {
    return $http.post('/jsonrpc?' + command, {
      id: ++rpcCount,
      jsonrpc: "2.0",
      method: command,
      params: data
    });
  };
};

module.exports.$inject = ['$http'];
