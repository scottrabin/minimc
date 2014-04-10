"use strict";

var rpcCount = 0;

module.exports = function XbmcService($http) {
  return function sendXbmcRpc(command, params) {
    return $http.post('/jsonrpc?' + command, {
      id: ++rpcCount,
      jsonrpc: "2.0",
      method: command,
      params: params.data
    }, {
      cache: params.cache
    });
  };
};

module.exports.$inject = ['$http'];
