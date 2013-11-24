/**
 * Returns true if `data` matches the requested `query`.
 *
 * @param {Object} query
 * @param {Object} data
 * @return {Boolean}
 */
exports.filter = function(query, data) {
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
};


/**
 * @param {String} str
 * @return {String}
 */
exports.sanitize = function(str) {
  str = str.trim().toLowerCase();
  if (!str) return;
  try {
    return new RegExp(str);
  } catch (err) {
    return str;
  }
};


/**
 * Returns true if the two arguments match.
 *
 * @param {String|Regexp} str
 * @param {String} haystack
 * @return {Boolean}
 */
function match(str, haystack) {
  if (!str) return false;
  haystack = haystack.toLowerCase();
  return typeof str === 'string'
    ? ~haystack.indexOf(str) : str.test(haystack);
}
