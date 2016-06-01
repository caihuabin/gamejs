var game = require('./game/game');
var UUID = require('node-uuid');
var socketSession = require('./util/socket-session');
var config = require('./config');

var socket = function(server){

	var io = require('socket.io')(server);

	io.use(function(client, next){
		if (!client.request.headers.cookie) return next(new Error('Authentication error'));

		socketSession(client.request.headers.cookie, 'connect.sid', [config.cookieSecret], function(err, sess){
			if(err){
				return next(err);
			}
			if(sess){
				client.user = sess.user;
				return next();
			}
			else{
				var err = new Error('UnAuthenticated');
				err.status = 401;
				return next(err);
			}
		});
	});

	io.on('connection', function(client){
	  	client.userid = UUID();
	  	client.status = 'connected';

	  	client.emit('onconnected', { id: client.userid } );
		console.log('\t socket.io:: player ' + client.userid + ' connected');
	  	/*client.on('my other event', function (data) {
	    	console.log(data);
	  	});*/
	  	
	  	//game.findGame(client);

	  	client.on('message', function(m) {
	    	game.onMessage(client, m);
	  	});

	  	client.on('disconnect', function () {
	    	if(client.gameid) {
	      		console.log('\t socket.io:: client disconnected ' + client.userid + ' ' + client.gameid);
	      		game.endGame(client);
	    	}
	  	});
	});
}


module.exports = socket;