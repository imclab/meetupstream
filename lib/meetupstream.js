var through = require('through');
var inject = require('reconnect/inject');
var request = require('request');
var JStream = require('jstream');


// meetup endpoint
var ENDPOINT = 'http://stream.meetup.com/2/photos';

// export stream wrapper
var stream = module.exports = through();

var reconnect = inject(function() {
  var req = request.apply(null, Array.prototype.slice.call(arguments));
  req.on('response', function() {
    req.emit('connect');
  });
  return req;
});

var r = reconnect().connect(ENDPOINT);
r.on('connect', function(res) {
  console.log('connected');
  var jstream = new JStream();
  res.pipe(jstream).pipe(stream);
});
r.on('disconnect', function() {
  console.log('disconnected');
});
