var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var config = require('../config');
var store = new RedisStore(
	{
		host: config.RedisHost, 
		port: config.RedisPort, 
		pass: config.RedisPass, 
		db: 2, 
		prefix:'sess'
	});

module.exports = store;