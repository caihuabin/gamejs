var signature = require('cookie-signature');
var cookie = require('cookie');
var redisSessionStore = require('./redis-session-store');

module.exports = function(cookies, name, secrets, callback){
  cookies = cookie.parse(cookies);
  name = name || 'connect.sid';

  var raw = cookies[name];

  if (raw) {
    if (raw.substr(0, 2) === 's:') {
      var val = unsigncookie(raw.slice(2), secrets);
      if (val !== false) {
        redisSessionStore.get(val, function(err, sess){
          if(err){
            return callback(err);
          }
          return callback(null, sess);
        });
      }
    }
  }
  return callback(new Error('cookie signature invalid'));
};

function unsigncookie(val, secrets) {
  for (var i = 0; i < secrets.length; i++) {
    var result = signature.unsign(val, secrets[i]);
    if (result !== false) {
      return result;
    }
  }
  return false;
}