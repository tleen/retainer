'use strict';

var async = require('async'),
pkg = require('../package.json'),
reflector = require('reflector'),
should = require('should'),
_ = require('underscore');

var port = 8080;
var url = 'http://localhost:' + port + '/';

var server = reflector({port : port});
before(server.start);

describe('versioning', function(){
  var retainer = require('..')();
  it('should have a version', function(){
    retainer.should.have.property('version');
  });

  it('should equal package version', function(){
    retainer.version.should.be.exactly(pkg.version);
  });
});

describe('data retreival', function(){  
  var r = require('..')();

  describe('get', function(){
    describe('data', function(){
      it('should return test data', function(done){
	var testURL = url + '?test=initial-test-data';
	r.get(testURL, function(err, body){
	  body.should.be.ok.and.a.String;
	  var data = JSON.parse(body);
	  data.should.be.ok.and.a.Object;
	  data.should.have.property('_meta').and.be.an.Object;
	  _.omit(data, '_meta').should.eql({'test' : 'initial-test-data'});
	  return done(err);
	});
      });
    });

    it('should return test data JSON', function(done){
      var testURL = url + '?test=initial-test-data';
      r.getJSON(testURL, function(err, json){
	json.should.be.ok.and.a.Object;
	json.should.have.property('_meta').and.be.an.Object;
	_.omit(json, '_meta').should.eql({'test' : 'initial-test-data'});
	return done(err);
      });
    });

    
    describe('cached data', function(){
      
      var data = {number : 100, string : 'foobar is not barfoo', date : (new Date()).toString()};
      var cachedTime = null;
      var originalReturnData = null;

      it('should get test data', function(done){
	r.getJSON(url, data, function(err, json){
	  json.should.be.ok.and.a.Object;
	  json.should.have.property('_meta').and.be.an.Object;
	  _.omit(json, '_meta').should.eql(data);
	  originalReturnData = json;
	  return done(err);
	});
      });

      it('should get test data from cache', function(done){
	r.getJSON(url, data, function(err, json){
	  json.should.eql(originalReturnData);
	  return done(err);
	});
      });

      it('should get test data from cache with extra request args', function(done){
	r.getJSON(url, data, {another : 'argument'}, function(err, json){
	  json.should.eql(originalReturnData);
	  return done(err);
	});
      });
    });
  });
});

describe('timed cache', function(){  
  var duration = 5000; // ms
  var r = require('..')({
    duration : duration
  });


  var testURL = (url + 'timed-cache/test/');
  var originalData = {title : 'this is the first data test', date : (new Date()).toString()};
  var originalReturnData = null;
  
  it('should load data into cache', function(done){
    r.getJSON(testURL, originalData, function(err, json){
      json.should.be.ok.and.a.Object;
      json.should.have.property('_meta').and.be.an.Object;
      _.omit(json, '_meta').should.eql(originalData);
      originalReturnData = json;
      return done(err);
    });
  });

  it('should wait for less than duration', function(done){
    this.timeout(duration);
    setTimeout(done, duration / 5);
  });

  it('should still have the same data', function(done){
    r.getJSON(testURL, originalData, function(err, json){
      json.should.be.ok.and.a.Object.and.eql(originalReturnData);
      json._meta.count.should.be.exactly(1);
      return done(err);
    });
  });

  it('should wait for less than duration', function(done){
    this.timeout(duration);
    setTimeout(done, duration / 5);
  });

  it('should still have the same data', function(done){
    r.getJSON(testURL, originalData, function(err, json){
      json.should.be.ok.and.a.Object.and.eql(originalReturnData);
      json._meta.count.should.be.exactly(1);
      return done(err);
    });
  });

  it('should still have the same data with extra request args', function(done){
    r.getJSON(testURL, originalData, {extradata : 'Should not be taken into account'}, function(err, json){
      json.should.be.ok.and.a.Object.and.eql(originalReturnData);
      json._meta.count.should.be.exactly(1);
      return done(err);
    });
  });


  it('should wait for duration', function(done){
    this.timeout(duration * 2);
    setTimeout(done, duration);
  });

  var nextReturnData = null;
  it('should have refreshed data', function(done){
    r.getJSON(testURL, originalData, function(err, json){
      json.should.be.ok.and.a.Object.and.not.eql(originalReturnData);
      json._meta.count.should.be.exactly(2);
      nextReturnData = json;
      return done(err);
    });
  });

  it('should still have the refreshed data', function(done){
    r.getJSON(testURL, originalData, function(err, json){
      json.should.be.ok.and.a.Object.and.eql(nextReturnData);
      return done(err);
    });
  });

  it('should wait for duration', function(done){
    this.timeout(duration * 2);
    setTimeout(done, duration);
  });

  it('should have refreshed data', function(done){
    r.getJSON(testURL, originalData, function(err, json){
      json.should.be.ok.and.a.Object.and.not.eql(nextReturnData);
      json._meta.count.should.be.exactly(3);
      return done(err);
    });
  });

  it('should clear', function(done){
    r.clear(done);
  });

  it('should have new data', function(done){
    r.getJSON(testURL, originalData, function(err, json){
      json.should.be.ok.and.a.Object;
      json._meta.count.should.be.exactly(4);
      return done(err);
    });
  });


});

after(server.stop);
