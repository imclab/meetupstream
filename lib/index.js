var connect = require('connect');
var stream = require('./meetupstream');
var util = require('./util');


var app = connect()
  .use(connect.static('public'))
  .listen(3000);

var Primus = require('primus');
var Emitter = require('primus-emitter');
var primus = new Primus(app, { transformer: 'engine.io' });
primus.use('emitter', Emitter);
var sockets = {};

primus.on('connection', function onConnection(spark) {
  sockets[spark.id] = spark;
  spark.on('subscribe', function onSubscribe(query) {
    if (query && typeof query === 'object' &&
       typeof query.search === 'string' &&
       typeof query.user === 'string' &&
       typeof query.latFrom === 'string' &&
       typeof query.latTo === 'string' &&
       typeof query.lonFrom === 'string' &&
       typeof query.lonTo === 'string' &&
       typeof query.city === 'string' &&
       typeof query.state === 'string' &&
       typeof query.country === 'string') {

      // Sanitize.
      query.search = util.sanitize(query.search);
      query.user = util.sanitize(query.user);
      query.latFrom = parseFloat(query.latFrom);
      query.latTo = parseFloat(query.latTo);
      query.lonFrom = parseFloat(query.lonFrom);
      query.lonTo = parseFloat(query.lonTo);
      query.city = util.sanitize(query.city);
      query.state = util.sanitize(query.state);
      query.country = util.sanitize(query.country);

      // Save query to socket.
      console.log('subscribe', query);
      primus.query = query;
    } else {
      console.warn('Invalid subscription query', query);
    }
  });

  spark.once('end', function onDisconnect() {
    delete sockets[spark.id];
  });
});

stream.on('data', function onData(data) {
  console.log(data);

  Object.keys(sockets).forEach(function(id) {
    var spark = sockets[id];
    var query = spark.query;
    if (!query) { return; }
    if (util.filter(query, data)) {
      spark.send('photo', {
        member: data.member,
        photo_link: data.photo_link,
        highres_link: data.highres_link,
        group: data.photo_album.group,
        event: data.photo_album.event
      });
    }
  });
});
