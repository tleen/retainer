'use strict';

var async = require('async'),
cachy = require('cachy'),
pkg = require('./package.json'),
request = require('request'),
url = require('url'),
_ = require('underscore');


/*
* store : cachy store
* defaults : request.js defaults
*
*/

module.exports = function(config){

  var configuration = _.defaults({}, config, {
    store : require('cachy-memory')(),
    defaults : {},
    concurrent : 10,
    throttle : 0
  });

  if(configuration.throttle) configuration.concurrent = 1;

  var cache = cachy(configuration.store,_.pick(configuration, 'duration'));
  var r = request.defaults(configuration.defaults);

 // xx - document this before I forget how it worked
  var queue = async.queue(function(task, callback){
    r.get(task.uri, task.callback);
    setTimeout(callback, configuration.throttle);
  }, configuration.concurrent);

  var get = function(){ // url, {args-cachable}, {args-uncachable}, callback
    var args = _.toArray(arguments);
    var callback = args.pop();
    
    // deconstruct uri
    var components = url.parse(args.shift(), true);

    // use initial args as part of url+querystring
    if(args.length){
      delete components.search; // force it to build from .query
      components.query = _.extend(components.query, args.shift());
    }

    var key = url.format(components);
    
    //if cache contains, get and return key'ed data

    // else add any args and call
    if(args.length){
      args.unshift(components.query);
      components.query = _.extend.apply(null, args);
    }

    var uri = url.format(components);
//    console.log('key', key);
//    console.log('url', uri);

    cache.has(key, function(has){

      if(has) return cache.get(key, callback);

      queue.push({
	uri : uri,
	callback : function(err, response, body){
	  // xx - what to do about http error codes?
	  if(err) return callback(err);
	  cache.put(key, body, function(err){
	    if(err) return callback(err);
	    return cache.get(key, callback);
	  }); 
	}});
    });	 
	
  };

  var getJSON = function(){
    var args = _.toArray(arguments);
    var callback = args.pop();
    args.push(function(err, data){
      if(err) return callback(err);
      return callback(null, JSON.parse(data));
    });
    get.apply(null, args);
  };

  return {
    version : pkg.version,
    clear : cache.clear,
    get : get,
    getJSON : getJSON
  };

};
