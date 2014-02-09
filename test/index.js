'use strict';

var pkg = require('../package.json'),
should = require('should');

describe('versioning', function(){
  var retainer = require('..')();
  it('should have a version', function(){
    retainer.should.have.property('version');
  });

  it('should equal package version', function(){
    retainer.version.should.be.exactly(pkg.version);
  });
});
