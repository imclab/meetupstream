/*global io, $, window, document */
// state
var $photos = $('#photos');
var photos = [];
var title = document.title;
var focused = true;
var unseen = 0;


// Update the page title when user is not looking at the page
// and photos come in. When they focus on the page again,
// change the title back.
$(window)
  .blur(function onBlur() {
    focused = false;
  })
  .focus(function onFocus() {
    unseen = 0;
    document.title = title;
    focused = true;
  });

var socket = io.connect();

socket.on('photo', function onPhoto(photo) {
  console.log('got photo', photo);

  // create html elements to represent new photo
  var $img = $('<img>')
    .attr('src', photo.photo_link);
  var $a = $('<a>')
    .attr('href', photo.highres_link)
    .attr('target', '_blank')
    .append($img);
  var $memberLink = $('<a>')
    .attr('href',
      'http://www.meetup.com/members/' + photo.member.member_id + '/')
    .text(photo.member.name);
  var $member = $('<div>')
    .addClass('member')
    .append($memberLink);
  var $groupLink = $('<a>')
    .attr('href', 'http://www.meetup.com/' + photo.group.urlname + '/')
    .text(photo.group.name);
  var $groupCity = $('<span>')
    .addClass('city')
    .text(photo.group.city);
  var $groupState = $('<span>')
    .addClass('state')
    .text(photo.group.state);
  var $groupCountry = $('<span>')
    .addClass('country')
    .text(photo.group.country);
  var $location = $('<div>')
    .addClass('location')
    .append($groupCity, $groupState, $groupCountry);
  var $group = $('<div>')
    .addClass('group')
    .append($groupLink, $location);
  var $eventLink = $('<a>')
    .attr('href', 'http://www.meetup.com/' + photo.group.urlname +
      '/events/' + photo.event.id + '/')
    .text(photo.event.name);
  var $event = $('<div>')
    .addClass('event')
    .append($eventLink);

  // add photo to page
  var $photo = $('<div>')
    .addClass('photo')
    .append($a, $member, $group, $event)
    .css('display', 'none')
    .prependTo($photos);

  $img.load(function onLoad() {
    $photo.slideDown('fast');
  });

  // keep track of photos
  photos.unshift($photo);
  if (!focused) {
    document.title = '(' + (++unseen) + ') ' + title;
  }

  // only display latest photos
  var MAX = 50;
  photos.slice(MAX).forEach(function($photo) {
    $photo.slideUp(function() {
      $photo.remove();
    });
  });
  photos = photos.slice(0, 50);
});


// filtering
var $form = $('#filter .form');
$('#filter h3').click(function onClick() {
  $form.slideToggle('fast');
});

var fieldnames = [
  'search'
, 'user'
, 'latFrom'
, 'latTo'
, 'lonFrom'
, 'lonTo'
, 'city'
, 'state'
, 'country'
];
var $fields = {};
fieldnames.forEach(function(name) {
  $fields[name] = $('#field-' + name);
});

$('#form').submit(function onClick(e) {
  e.preventDefault();
  updateQuery();

  // update the url
  var components = [];
  fieldnames.forEach(function(name) {
    var value = query[name];
    if (value) {
      components.push(encodeURIComponent(name) + '=' +
        encodeURIComponent(value));
    }
  });
  var uri = components.join('&');
  document.location = '/?' + uri;

});

// When the page loads, populate the fields in the form with the values
// from the search part of the URL.
window.location.search.slice(1)
  .split('&')
  .filter(function(s) { return !!s; })
  .forEach(function(component) {
    var parts = component.split('=');
    var key = decodeURIComponent(parts[0]);
    var value = decodeURIComponent(parts[1]);
    $fields[key].val(value);
  });


// Gets the values from the fields in the form and saves
// them into an object.
var query;

function updateQuery() {
  query = {};
  fieldnames.forEach(function(name) {
    query[name] = $fields[name].val();
  });
}

// On connect, subscribe to certain photos
// based on the query given from the URL.
socket.on('connect', function() {
  updateQuery();
  socket.emit('subscribe', query);
});


// When user types in the text fields that can be turned into
// RegExps on the server, try to do it on the client side to let them
// know if it will compile fine.
$('input.regexp').each(function(i, el) {
  var $el = $(el);
  var $rs = $el.siblings('span');

  $el.on('keypress input', function() {
    try {
      new RegExp($el.val());
      $rs.html('&#10003;');
      $rs.css('color', 'green');
    } catch (err) {
      $rs.html('x');
      $rs.css('color', 'red');
    }
  });
});
