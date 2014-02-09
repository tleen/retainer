'use strict';

var pkg = require('./package.json');

module.exports = function(config){

  return {
    version : pkg.version
  };

};
