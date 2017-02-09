var util = require('util');

var requestAnimationFrame, cancelAnimationFrame;
(function() {
    var frame_time = 45; //on server we run at 45ms, 22hz
    var lastTime = 0;
    var timeout = 0;
    requestAnimationFrame = function(callback, element) {
        var start,
            finish;
        var id = setTimeout(function() {
            start = +new Date();
            callback(start);
            finish = +new Date();
            timeout = frame_time - (finish - start);
        }, timeout);
        return id;
    };
    cancelAnimationFrame = function(id) { clearTimeout(id); };
}());

/* The GameServer class */
var GameServer = function(gameid, limit) {
    this.gameid = gameid;
    this.world = {
        width: 1600,
        height: 900
    };

    this.players = [];
    this.player_limit = limit;
    // Time
    this.startTime = 0;
    this.lastTime = 0;
    this.gameTime = 0;
    this.fps = 0;
    this.STARTING_FPS = 60;

    this.active = false;
    this.paused = false;
    this.startedPauseAt = 0;
    this.PAUSE_TIMEOUT = 100;

    this.server_time = 0;
    this.laststate = {};
};

var GamePlayer = function(client, data) {
    this.client = client;

    this.width = 64;
    this.height = 64;
    this.pos = { x: this.width / 2, y: 1366 - this.height / 2 };
    this.velocityX = 500;
    this.velocityY = 500;

    this.color = 'rgba(255,255,255,0.1)';
    this.info_color = 'rgba(255,255,255,0.1)';

    this.inputs = [];
    this.last_input_seq = -1;
    this.bullets = [];

    this.pos_limits = {
        x_min: this.width / 2,
        x_max: 1366 - this.width / 2,
        y_min: this.height / 2,
        y_max: 705 - this.height / 2
    };
    this.heading = Math.PI / 2;
    this.score = data ? data.score : 0;
};

GameServer.prototype = {
    addPlayer: function(client, data) {
        var player = null;

        if (this.check_available()) {
            player = new GamePlayer(client, data);
            this.players.push(player);
            client.send('s#h#' + String(this.server_time));

            var other_players = this.getOtherPlayers(client.userid);
            other_players.forEach(function(item) {
                item.client.send('s#j#' + JSON.stringify({ id: client.userid, pos: player.pos, heading: player.heading, score: player.score }));
                client.send('s#j#' + JSON.stringify({ id: item.client.userid, pos: item.pos, heading: item.heading, score: item.score }));
            });
        } else {
            throw (new Error('the players are full,select another game.'));
        }
    },
    removePlayer: function(client) {
        var len = this.players.length;
        var the_remove = null;

        for (var i = 0; i < len; i++) {
            if (this.players[i].client.userid === client.userid) {

                the_remove = this.players.splice(i, 1)[0];

                delete this.laststate[client.userid];
                this.players.forEach(function(item) {
                    item.client.send('s#e#' + JSON.stringify({ id: client.userid }));
                });
                break;
            }
        }
        return the_remove;
    },
    check_available: function() {
        return this.players.length < this.player_limit;
    },
    getPlayer: function(userid) {
        var len = this.players.length;
        for (var i = 0; i < len; i++) {
            if (this.players[i].client.userid === userid) {
                return this.players[i];
            }
        }
    },
    getOtherPlayers: function(except) {
        return this.players.filter(function(item) {
            return item.client.userid !== except;
        });
    },
    start: function(t) {
        this.startTime = +new Date(); // Record game's startTime (used for pausing)
        this.active = true;

        this.updateid = requestAnimationFrame(this.update.bind(this));
    },
    update: function(time) {
        var self = this;

        if (this.paused) {
            setTimeout(function() {
                this.updateid = requestAnimationFrame(self.update.bind(self));
            }, this.PAUSE_TIMEOUT);
        } else {
            this.tick(time);
            this.lastTime = time;
            this.server_time = this.gameTime;

            this.players.forEach(function(item) {
                this.process_input(item);
                this.check_collision(item);

                this.laststate[item.client.userid] = {
                    pos: item.pos,
                    bullets: item.bullets,
                    heading: item.heading,
                    seq: item.last_input_seq
                };
                this.laststate['time'] = this.server_time;
                item.bullets = [];
            }.bind(this));
            this.players.forEach(function(item) {
                item.client.emit('onserverupdate', this.laststate);
            }.bind(this));
            this.updateid = requestAnimationFrame(this.update.bind(this));
        }
    },
    stop: function() {
        cancelAnimationFrame(this.updateid);
    },
    handle_message: function(client, message) {
        var message_parts = message.split('#'),
            message_type = message_parts[0];
        var data;
        var other_players = this.getOtherPlayers(client.userid);
        switch (message_type) {
            case 'i':
                data = { userid: client.userid, message: JSON.parse(message_parts[1]) };
                other_players.forEach(function(item) {
                    item.client.emit('oninput', data);
                });
                this.handle_input(data);
                break;
            case 'c':
                data = { userid: client.userid, message: message_parts[1] };
                this.getPlayer(client.userid).color = message_parts[1];
                other_players.forEach(function(item) {
                    item.client.send('s#c#' + JSON.stringify(data));
                });
                break;
            default:
                break;
        }
    },
    handle_input: function(data) {
        var player = this.getPlayer(data.userid);
        var inputs = data.message;
        if (util.isArray(inputs)) {
            player.inputs = player.inputs.concat(inputs);
        }
    },
    process_input: function(player) {
        var x_dir = 0;
        var y_dir = 0;
        var heading = null;
        var ic = player.inputs.length;
        if (ic) {
            for (var j = 0; j < ic; ++j) {
                if (player.inputs[j].seq <= player.last_input_seq) continue;
                var item = player.inputs[j],
                    input = item.input;
                switch (input) {
                    case 'l':
                        --x_dir;
                        break;
                    case 'r':
                        ++x_dir;
                        break;
                    case 'u':
                        --y_dir;
                        break;
                    case 'd':
                        ++y_dir;
                        break;
                    case 'M':
                        player.bullets.push(item.data);
                        break;
                    case 'A':
                        heading = item.data;
                        break;
                    case '+':
                        ++player.score;
                    default:
                        break;
                }
            }
            player.last_input_time = player.inputs[ic - 1].time;
            player.last_input_seq = player.inputs[ic - 1].seq;
            player.inputs = [];
        }
        player.pos.y += y_dir * player.velocityY / 60;
        player.pos.x += x_dir * player.velocityX / 60;
        if (heading !== null) {
            player.heading = heading;
        }
    },
    check_collision: function(item) {
        if (item.pos.x <= item.pos_limits.x_min) {
            item.pos.x = item.pos_limits.x_min;
        }
        if (item.pos.x >= item.pos_limits.x_max) {
            item.pos.x = item.pos_limits.x_max;
        }
        if (item.pos.y <= item.pos_limits.y_min) {
            item.pos.y = item.pos_limits.y_min;
        }
        if (item.pos.y >= item.pos_limits.y_max) {
            item.pos.y = item.pos_limits.y_max;
        }

        if (item.heading > Math.PI * 2 || item.heading < 0) {
            item.heading = Math.PI / 2;
        }
    },
    togglePaused: function() {
        var now = +new Date();

        this.paused = !this.paused;

        if (this.paused) {
            this.startedPauseAt = now;
        } else { // not paused
            // Adjust start time, so game starts where it left off when
            // the user paused it.

            this.startTime = this.startTime + now - this.startedPauseAt;
            this.lastTime = now;
        }
    },
    tick: function(time) {
        this.updateFrameRate(time);
        this.gameTime = +new Date() - this.startTime;
    },
    updateFrameRate: function(time) {
        if (this.lastTime === 0) this.fps = this.STARTING_FPS;
        else this.fps = 1000 / (time - this.lastTime);
    },
};

if ('undefined' != typeof global) {
    module.exports = GameServer;
}
