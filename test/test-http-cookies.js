'use strict';
/* global suite: false, setup: false, test: false,
    teardown: false, suiteSetup: false, suiteTeardown: false */
var assert = require('assert');
var common = require('./common');
var http = require('http');
var RAIL = require('../');


suite('http:cookies', function() {
  var rail, server;
  var onrequest;

  var listener = function(request, response) {
    if (typeof onrequest === 'function') {
      onrequest(request, response);
    }
  };


  suiteSetup(function(done) {
    rail = new RAIL({
      request: {
        host: 'localhost',
        headers: {
          'Hello': 'World'
        }
      }
    });
    rail.use('cookies');

    server = http.createServer(listener);
    server.listen(common.port, done);
  });


  test('parse', function(done) {
    onrequest = function(request, response) {
      response.writeHead(200, {
        'set-cookie': 'name=value; Path=/; Secure'
      });
      response.end('pong');
    };

    rail.call({
      proto: 'http',
      port: common.port
    }, function(response) {
      var body = [];
      assert.strictEqual(response.statusCode, 200);

      assert(response.cookies);
      assert(response.cookies.name);
      assert.strictEqual(response.cookies.name.name, 'name');
      assert.strictEqual(response.cookies.name.value, 'value');
      assert.strictEqual(response.cookies.name.path, '/');
      assert.strictEqual(response.cookies.name.secure, true);

      assert(rail.plugins.cookies.jar.localhost);
      assert.strictEqual(rail.plugins.cookies.jar.localhost.name,
          response.cookies.name);

      response.on('readable', function() {
        var data = response.read();

        if (data) {
          body.push(data);
        }
      });

      response.on('end', function() {
        body = Buffer.concat(body);
        assert.strictEqual(body.length, 4);
        assert.strictEqual(body.toString(), 'pong');
        done();
      });
    }).end('ping');
  });


  test('set', function(done) {
    onrequest = function(request, response) {
      assert(request.headers.cookie);
      assert.strictEqual(request.headers.cookie, 'name=value');

      response.end('pong');
    };

    rail.call({
      proto: 'http',
      port: common.port
    }, function(response) {
      var body = [];
      assert.strictEqual(response.statusCode, 200);

      response.on('readable', function() {
        var data = response.read();

        if (data) {
          body.push(data);
        }
      });

      response.on('end', function() {
        body = Buffer.concat(body);
        assert.strictEqual(body.length, 4);
        assert.strictEqual(body.toString(), 'pong');
        done();
      });
    }).end('ping');
  });


  test('parse expired', function(done) {
    onrequest = function(request, response) {
      response.writeHead(200, {
        'set-cookie': 'name=value; Path=/; Expires=Mon, 20 Apr 2015 21:47:08 GMT; Secure'
      });
      response.end('pong');
    };

    rail.call({
      proto: 'http',
      port: common.port
    }, function(response) {
      var body = [];
      assert.strictEqual(response.statusCode, 200);

      assert(response.cookies);
      assert(response.cookies.name);
      assert.strictEqual(response.cookies.name.name, 'name');
      assert.strictEqual(response.cookies.name.value, 'value');
      assert.strictEqual(response.cookies.name.path, '/');
      assert.strictEqual(response.cookies.name.secure, true);
      assert.strictEqual(response.cookies.name.expires, 1429566428000);

      assert(rail.plugins.cookies.jar.localhost);
      assert.strictEqual(rail.plugins.cookies.jar.localhost.name,
          response.cookies.name);

      response.on('readable', function() {
        var data = response.read();

        if (data) {
          body.push(data);
        }
      });

      response.on('end', function() {
        body = Buffer.concat(body);
        assert.strictEqual(body.length, 4);
        assert.strictEqual(body.toString(), 'pong');
        done();
      });
    }).end('ping');
  });


  test('set expired', function(done) {
    onrequest = function(request, response) {
      assert(!request.headers.cookie);
      response.end('pong');
    };

    rail.call({
      proto: 'http',
      port: common.port
    }, function(response) {
      var body = [];
      assert.strictEqual(response.statusCode, 200);

      response.on('readable', function() {
        var data = response.read();

        if (data) {
          body.push(data);
        }
      });

      response.on('end', function() {
        body = Buffer.concat(body);
        assert.strictEqual(body.length, 4);
        assert.strictEqual(body.toString(), 'pong');
        done();
      });
    }).end('ping');
  });


  suiteTeardown(function(done) {
    server.close(done);
  });
});
