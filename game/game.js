var UUID        = require('node-uuid');
var GameServer = require('./gameServer.js');
var redisClient = require('../util/redisClient');

var Game = {
    games: {},
    game_count: 0,
    fake_latency: 0,
    messages: [],
    onMessage: function(client, message) {
        if(this.fake_latency && message.split('#')[0].substr(0,1) == 'i') {
                //store all input message
            this.messages.push({client:client, message:message});
            setTimeout(function(){
                if(this.messages.length) {
                    this._onMessage( this.messages[0].client, this.messages[0].message );
                    this.messages.splice(0,1);
                }
            }.bind(this), this.fake_latency);
        } else {
            this._onMessage(client, message);
        }
    },
    _onMessage: function(client, message) {
        var message_parts = message.split('#');
        var message_type = message_parts[0];

        var thegame = this.getGame(client.gameid);
        
        switch(message_type){
            case 'i':
            case 'c'://Client changed their color!
                thegame.handle_message(client, message);
                break;
            case 'p':
                client.send('s#p#' + message_parts[1]);
                break;
            case 'l':
                this.fake_latency = parseFloat(message_parts[1]);
                break;
            default:
                break;
        }
    },

    getGame: function(gameid){
        return this.games[gameid];
    },
    getAvailableGames: function(){
        var games = [];
        for(var key in this.games){
            if(!this.games.hasOwnProperty(key)) continue;
            if(this.games[key].check_available()){
                games.push(this.games[key]);
            }
        }
        return games;
    },
    createGame: function(client, player_limit) {
        var gameid = UUID();
        var thegame = new GameServer(gameid, player_limit);
        this.games[gameid] = thegame;
        this.game_count++;
        this.startGame(thegame);

        var cache_key = 'player' + client.userid;
        redisClient.getItem(cache_key, function (err, data) {
            if (err) {
                console.log('error:' + err.message);
            }
            else{
                try{
                    thegame.addPlayer(client, data);
                    client.gameid = thegame.gameid;
                    console.log('server host at:  ' + thegame.server_time);
                    console.log('player: ' + client.userid + ' created a game with id: ' + client.gameid);
                }
                catch(err){
                    console.log('error:' + err.message);
                }
            }
        });
        
        return thegame;
    },
    startGame: function(game) {
        game.start(new Date().getTime());
    },
    findGame: function(client) {
        console.log('looking for a game. We have : ' + this.game_count);
        if(this.game_count) {
            var games = this.getAvailableGames();
            var thegame = games[0];

            if(games.length > 0) {
                thegame.addPlayer(client);
                client.gameid = thegame.gameid;
                console.log('player ' + client.userid + ' joined a game with id ' + client.gameid);
            }
            else {
                this.createGame(client, 3);
            }
        } 
        else {
            this.createGame(client, 3);
        }
    },
    endGame: function(client) {
        var thegame = this.getGame(client.gameid);
        
        if(thegame) {
            var player = thegame.removePlayer(client);
            client.gameid = null;
            if(thegame.players.length < 1) {
                delete this.games[thegame.gameid];
                this.game_count--;
                console.log('game removed. there are now ' + this.game_count + ' games' );
            }
            delete player.client;
            var cache_key = 'player' + client.userid;
            /*redisClient.setItem(cache_key, player, redisClient.defaultExpired, function (err) {
                if (err) {
                    console.log('error:' + err.message);
                }
                else{
                    
                }
            });*/
        } 
        else {
            console.log('that game was not found!');
        }
    }

};

module.exports = Game;