var GameClient = function(){
    
    this.players = {self: null, other: []};

    this.create_configuration();
    if(String(window.location).indexOf('debug') != -1) {
        this.create_debug_gui();
    }
    return this;
}

var GamePlayer = function(sprite, id) {
    this.sprite = sprite;
    this.info_color = 'rgba(255,255,255,0.1)';

    this.state = 'not-connected';
    this.online = false;
    this.id = id;
    this.state_time = new Date().getTime();

};
GameClient.prototype = {
    start: function(){
        this.socket = io.connect();
        this.connect();
    },
    connect: function(){
        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.on('disconnect', this.onDisconnect.bind(this));
        this.socket.on('message', this.onMessage.bind(this));
        this.socket.on('error', this.onDisconnect.bind(this));
        if(true){
            this.socket.on('oninput', this.onInput.bind(this));
        }
        else{
            this.socket.on('onserverupdate', this.onServerUpdate.bind(this));
        }
        this.socket.on('onconnected', this.onConnected.bind(this));
    },
    create_ping_timer: function() {
            //Set a ping timer to 1 second, to maintain the ping/latency between
            //client and server and calculated roughly how our connection is doing
        setInterval(function(){
            this.last_ping_time = new Date().getTime() - this.fake_lag;
            this.socket.send('p#' + (this.last_ping_time) );
        }.bind(this), 1000);
        
    },
    onDisconnect: function(data) {
            //When we disconnect, we don't know if the other player is
            //connected or not, and since we aren't, everything goes to offline
        this.players.self.info_color = 'rgba(255,255,255,0.1)';
        this.players.self.state = 'not-connected';
        this.players.self.online = false;

        this.players.other.forEach(function(item){
            item.info_color = 'rgba(255,255,255,0.1)';
            item.state = 'not-connected';
        });
    },
    onMessage: function(data) {
        var commands = data.split('#');
        var command = commands[0];
        var subcommand = commands[1] || null;
        var commanddata = commands[2] || null;
        switch(command) {
            case 's':
                switch(subcommand) {
                    case 'h' : //host a game requested
                        this.onCreateGameMessage(commanddata); 
                        break;
                    case 'j' : //join a game requested
                        this.onJoinGameMessage(JSON.parse(commanddata)); 
                        break;
                    case 'r' : //ready a game requested
                        this.onReadyGameMessage(commanddata); 
                        break;
                    case 'e' : //end game requested
                        this.onOtherPlayerDisconnect(JSON.parse(commanddata) );
                        break;
                    case 'p' : //server ping
                        this.onPingMessage(commanddata); 
                        break;
                    case 'c' : //other player changed colors
                        this.onOtherPlayerColorChangeMessage(JSON.parse(commanddata)); 
                        break;
                }
            break;
        }
    },
    onInput: function(data){

        var player = this.getPlayer(data.userid);
        if(Array.isArray(data.message) ){
            player.sprite.inputs = player.sprite.inputs.concat(data.message);
        }
    },
    onServerUpdate: function(data){
            //Store the server time (this is offset by the latency in the network, by the time we get it)
        this.server_time = data.time;
            //Update our local offset time from the last server update
        this.client_time = this.server_time - (this.net_offset/1000);
            //set the position directly as the server tells you.
        var player = null,
            sprite = null,
            item = null;
        
        for(var key in data){
            if(!data.hasOwnProperty(key)) continue;
            player = this.getPlayer(key);
            item = data[key];
            if(player == null) continue;
            sprite = player.sprite;
            if(item.seq <= sprite.last_input_seq) continue;
            sprite.top = item.pos.y;
            sprite.left = item.pos.x;
            sprite.heading = item.heading;
            item.fires.forEach(function(fire){
                sprite.fires.push(new Fire(fire[0], fire[1], fire[2], fire[3]));
            });
            
        }
    },
    onConnect: function(){

    },
    onConnected: function(data) {
        var self_sprite = createSprite('self_sprite', spaceShipPainter, [handle_input, process_input, check_collision], {});
        self_sprite.color = CONSTANT.SPACESHIPCOLOR1;
        game.addSprite(self_sprite);

        var self_player = new GamePlayer(self_sprite, data.id);
        self_player.info_color = '#cc0000';
        self_player.state = 'connected';
        self_player.online = true;

        this.players.self = self_player;
        game.start();
    },
    onReadyGameMessage: function(data) {

        var server_time = parseFloat(data);
        this.local_time = server_time + this.net_latency;
        console.log('server time is about ' + this.local_time);

        this.players.info_color = '#2288cc';
        this.players.self.state = 'YOU ' + this.players.self.state;
        this.socket.send('c#' + this.players.self.color);
    },
    onJoinGameMessage: function(data) {
        var other_sprite = createSprite('other_sprite', spaceShipPainter, [process_input, check_collision], {left: data.pos.x, top: data.pos.y, heading: data.heading});
        other_sprite.color = CONSTANT.SPACESHIPCOLOR2;
        game.addSprite(other_sprite);

        var other_player = new GamePlayer(other_sprite, data.id);
        other_player.info_color = '#cc0000';
        other_player.state = 'connected';
        other_player.online = true;

        this.players.other.push(other_player);
    },
    onCreateGameMessage: function(data) {
        var server_time = parseFloat(data);
        this.local_time = server_time + this.net_latency;
        this.players.self.info_color = '#cc0000';
    },
    onOtherPlayerDisconnect: function(data){
        var player = this.getPlayer(data.id);
        var sprite = player.sprite;
        
        this.removePlayer(data.id);
        game.removeSprite(sprite);
        
    },
    onOtherPlayerColorChangeMessage: function(data) {
        var player = this.getPlayer(data.userid);
        player.sprite.color = data.message;
    },
    onPingMessage: function(data) {
        this.net_ping = new Date().getTime() - parseFloat( data );
        this.net_latency = this.net_ping/2;
    },
    addPlayer: function(player){

    },
    removePlayer: function(userid){
        var len = this.players.other.length;
        for(var i = 0; i < len; i++){
            if(this.players.other[i].id === userid){
                this.players.other.splice(i, 1);
                break;
            }
        }
    },
    getPlayer: function(userid){
        var len = this.players.other.length;
        if(this.players.self.id === userid){
            return this.players.self;
        }
        else{
            for(var i = 0; i < len; i++){
                if(this.players.other[i].id === userid){
                    return this.players.other[i];
                }
            }
        }
        return null;
    },
    create_configuration: function() {
        this._pdt = 0.0001;                 //The physics update delta time
        this._pdte = new Date().getTime();  //The physics update last delta time
            //A local timer for precision on server and client
        this.local_time = 0.016;            //The local timer
        this._dt = new Date().getTime();    //The local timer delta
        this._dte = new Date().getTime();   //The local timer last frame time

        this.show_help = false;             //Whether or not to draw the help text
        this.naive_approach = false;        //Whether or not to use the naive approach
        this.show_server_pos = false;       //Whether or not to show the server position
        this.show_dest_pos = false;         //Whether or not to show the interpolation goal
        this.client_predict = true;         //Whether or not the client is predicting input
        this.input_seq = 0;                 //When predicting client inputs, we store the last input as a sequence number
        this.client_smoothing = true;       //Whether or not the client side prediction tries to smooth things out
        this.client_smooth = 25;            //amount of smoothing to apply to client update dest

        this.net_latency = 0.001;           //the latency between the client and the server (ping/2)
        this.net_ping = 0.001;              //The round trip time from here to the server,and back
        this.last_ping_time = 0.001;        //The time we last sent a ping
        this.fake_lag = 0;                //If we are simulating lag, this applies only to the input client (not others)
        this.fake_lag_time = 0;

        this.net_offset = 100;              //100 ms latency between server and client interpolation for other clients
        this.buffer_size = 2;               //The size of the server history to keep for rewinding/interpolating.
        this.target_time = 0.01;            //the time where we want to be in the server timeline
        this.oldest_tick = 0.01;            //the last time tick we have available in the buffer

        this.client_time = 0.01;            //Our local 'clock' based on server time - client interpolation(net_offset).
        this.server_time = 0.01;            //The time the server reported it was at, last we heard from it
        this.dt = 0.016;                    //The time that the last frame took to run
        this.fps = 0;                       //The current instantaneous fps (1/this.dt)
        this.fps_avg_count = 0;             //The number of samples we have taken for fps_avg
        this.fps_avg = 0;                   //The current average fps displayed in the debug UI
        this.fps_avg_acc = 0;               //The accumulation of the last avgcount fps samples
        this.lit = 0;
        this.llt = new Date().getTime();
    },
    create_debug_gui: function() {
        this.gui = new dat.GUI();
        var _playersettings = this.gui.addFolder('Your settings');
            this.colorcontrol = _playersettings.addColor(this, 'color');
                //We want to know when we change our color so we can tell
                //the server to tell the other clients for us
            this.colorcontrol.onChange(function(value) {
                this.players.self.color = value;
                localStorage.setItem('color', value);
                this.socket.send('c#' + value);
            }.bind(this));

            _playersettings.open();
        var _othersettings = this.gui.addFolder('Methods');
            _othersettings.add(this, 'naive_approach').listen();
            _othersettings.add(this, 'client_smoothing').listen();
            _othersettings.add(this, 'client_smooth').listen();
            _othersettings.add(this, 'client_predict').listen();
        var _debugsettings = this.gui.addFolder('Debug view');
        
            _debugsettings.add(this, 'show_help').listen();
            _debugsettings.add(this, 'fps_avg').listen();
            _debugsettings.add(this, 'show_server_pos').listen();
            _debugsettings.add(this, 'show_dest_pos').listen();
            _debugsettings.add(this, 'local_time').listen();
            _debugsettings.open();
        var _consettings = this.gui.addFolder('Connection');
            _consettings.add(this, 'net_latency').step(0.001).listen();
            _consettings.add(this, 'net_ping').step(0.001).listen();
                //When adding fake lag, we need to tell the server about it.
            var lag_control = _consettings.add(this, 'fake_lag').step(0.001).listen();
            lag_control.onChange(function(value){
                this.socket.send('l#' + value);
            }.bind(this));
            _consettings.open();
        var _netsettings = this.gui.addFolder('Networking');
            
            _netsettings.add(this, 'net_offset').min(0.01).step(0.001).listen();
            _netsettings.add(this, 'server_time').step(0.001).listen();
            _netsettings.add(this, 'client_time').step(0.001).listen();
            //_netsettings.add(this, 'oldest_tick').step(0.001).listen();
            _netsettings.open();

    },
    create_timer: function(){
        setInterval(function(){
            this._dt = new Date().getTime() - this._dte;
            this._dte = new Date().getTime();
            this.local_time += this._dt/1000.0;
        }.bind(this), 4);
    }
}


function createSprite(name, painter, update, opts){
    var sprite = new Sprite(name, painter, update);
    sprite.width = CONSTANT.SPACESHIPWIDTH;
    sprite.height = CONSTANT.SPACESHIPHEIGHT;
    sprite.color = CONSTANT.SPACESHIPCOLOR1;

    sprite.top = opts.top || CONSTANT.WORLD_HEIGHT - sprite.height/2;
    sprite.left = opts.left || sprite.width/2;
    sprite.heading = opts.heading || Math.PI/2;
    sprite.velocityX = sprite.velocityY = 500; // pixels/second

    sprite.input = {left:false, right:false, up: false, down: false, mouse: null, score: false, damage: false};
    sprite.inputs = [];
    sprite.input_seq = 0;
    sprite.last_input_seq = -1;

    sprite.fires = [];

    sprite.position_limit = {
        top_min: 0 + sprite.height/2,
        left_min: 0 + sprite.width/2,
        top_max: CONSTANT.WORLD_HEIGHT - sprite.height/2,
        left_max: CONSTANT.WORLD_WIDTH - sprite.width/2
    };
    return sprite;
}