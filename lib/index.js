var connect = require('connect');
var stream = require('./meetupstream');
var util = require('./util');


var app = connect()
  .use(connect.static('public'))
  .listen(3000);

var io = require('socket.io').listen(app, { 'log level': 1 });
var sockets = {};

io.sockets.on('connection', function onConnection(socket) {
  sockets[socket.id] = socket;
  socket.on('subscribe', function onSubscribe(query) {
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

      // sanitize
      query.search = util.sanitize(query.search);
      query.user = util.sanitize(query.user);
      query.latFrom = parseFloat(query.latFrom);
      query.latTo = parseFloat(query.latTo);
      query.lonFrom = parseFloat(query.lonFrom);
      query.lonTo = parseFloat(query.lonTo);
      query.city = util.sanitize(query.city);
      query.state = util.sanitize(query.state);
      query.country = util.sanitize(query.country);

      // save query to socket
      console.log('subscribe', query);
      socket.set('query', query);
    } else {
      console.warn('Invalid subscription query', query);
    }
  });

  socket.once('disconnect', function onDisconnect() {
    delete sockets[socket.id];
  });
});

stream.on('data', function onData(data) {
  console.log(data);

  Object.keys(sockets).forEach(function(id) {
    var socket = sockets[id];
    socket.get('query', function(err, query) {
      if (err) throw err;
      if (!query) return;

      if (util.filter(query, data)) {
        socket.emit('photo', {
          member: data.member,
          photo_link: data.photo_link,
          highres_link: data.highres_link,
          group: data.photo_album.group,
          event: data.photo_album.event
        });
      }
    });
  });
});
