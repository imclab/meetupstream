var PassThrough = require('readable-stream').PassThrough;
var inject = require('reconnect/inject');
var request = require('request');
var JStream = require('jstream');


// meetup endpoint
var ENDPOINT = 'http://stream.meetup.com/2/photos';

// export stream wrapper
var stream = module.exports = new PassThrough({ objectMode: true });

var reconnect = inject(function() {
  return request.apply(null, Array.prototype.slice.call(arguments));
});

var r = reconnect(function(res) {
  console.log('connected');
  var jstream = new JStream();
  res.pipe(jstream).pipe(stream);
}).connect({ uri: ENDPOINT, timeout: 30000 });

r.on('disconnect', function() {
  console.log('disconnected');
});
