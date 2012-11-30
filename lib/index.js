var connect = require('connect');
var stream = require('./meetupstream');


var app = connect()
  .use(connect['static']('public'))
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
      query.search = sanitize(query.search);
      query.user = sanitize(query.user);
      query.latFrom = parseFloat(query.latFrom);
      query.latTo = parseFloat(query.latTo);
      query.lonFrom = parseFloat(query.lonFrom);
      query.lonTo = parseFloat(query.lonTo);
      query.city = sanitize(query.city);
      query.state = sanitize(query.state);
      query.country = sanitize(query.country);

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

      if (filter(query, data)) {
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


function filter(query, data) {
  // query fields
  var search = query.search;
  var user = query.user;
  var latFrom = query.latFrom;
  var latTo = query.latTo;
  var lonFrom = query.lonFrom;
  var lonTo = query.lonTo;
  var city = query.city;
  var state = query.state;
  var country = query.country;

  // data fields
  var member = data.member;
  var event = data.photo_album.event;
  var group = data.photo_album.group;

  return (!search && !user && !latFrom && !latTo &&
          !lonFrom && !lonTo && !city && !state && !country) ||
       (event && match(search, event.name) ||
       match(search, group.name) ||
       group.group_topics.some(function(topic) {
         return match(search, topic.topic_name);
       })) ||
      match(user, member.name) ||
      (latFrom && latTo &&
        ((latFrom <= group.group_lat && group.group_lat <= latTo) ||
         (latFrom >= group.group_lat && group.group_lat >= latTo))) ||
      (lonFrom && lonTo &&
        ((lonFrom <= group.group_lon && group.group_lon <= lonTo) ||
         (lonFrom >= group.group_lon && group.group_lon >= lonTo))) ||
      match(city, group.city) ||
      match(state, group.state) ||
      match(country, group.country)
   ;
}


function sanitize(str) {
  str = str.trim().toLowerCase();
  if (!str) return;
  try {
    return new RegExp(str);
  } catch (err) {
    return str;
  }
}


function match(str, haystack) {
  if (!str) return false;
  haystack = haystack.toLowerCase();
  return typeof str === 'string'
    ? ~haystack.indexOf(str) : str.test(haystack);
}
