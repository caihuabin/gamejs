define(function(require){
  var config = require('./config');
  var CONSTANT = config.CONSTANT;
  var eventEmitter = config.eventEmitter;

  var Sprite = require('game/sprites').Sprite;
  var io = require('socket.io/socket.io');
  var gameUtil = require('game/util');
  var Interpolation = gameUtil.Interpolation;
  var colorToRGB = gameUtil.colorToRGB;

  var GameRender = require('./gameRender');
  var spaceShipPainter = GameRender.spaceShipPainter;
  var Fire = GameRender.Fire;

  var GameInput = require('./gameInput');
  var handleInput = GameInput.handleInput;
  var processInput = GameInput.processInput;
  var checkCollision = GameInput.checkCollision;

  var GameClient = function(gameEngine){
    this.gameEngine = gameEngine;
    this.players = {self: null, other: []};
    this.server_updates = [];
    this.server_packet = '';
    this.create_configuration();
    this.create_timer();
    
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
      this.socket.on('connect', this.onConnect.bind(this) );
      eventEmitter.addListener('socket-send', function(server_packet){
        this.socket.send(server_packet);
      }.bind(this));
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
              this.onJoinGameMessage(commanddata); 
              break;
            case 'j' : //join a game requested
              this.onOtherPlayerJoinGameMessage(JSON.parse(commanddata)); 
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
            case 'w':
              console.log('server warning: ' + commanddata);
              break;
          }
        break;
      }
    },
    onInput: function(data){
      if(!this.client_predict) return;
      var player = this.getPlayer(data.userid);
      if(Array.isArray(data.message) ){
        player.sprite.inputs = player.sprite.inputs.concat(data.message);
      }
    },
    onServerUpdate: function(data){
        //Store the server time (this is offset by the latency in the network, by the time we get it)
      this.server_time = data.time;
      this.client_time = this.server_time - (this.net_offset/1000);

      if(this.client_predict) return;

      this.server_updates.push(data);
      if(this.server_updates.length >= ( 10*this.buffer_size )) {
        this.server_updates.splice(0,1);
      }
      
      var server_updates_length = this.server_updates.length;
      var previous_state = last_state = null;

      if(server_updates_length > 1){
        previous_state = this.server_updates[server_updates_length - 2];
        last_state = this.server_updates[server_updates_length - 1];
      }
      else{
        previous_state = last_state = this.server_updates[0];
      }
      
      var player = null,
        sprite = null,
        previous_item = null,
        last_item = null,
        pos = null;

      var smooth = Number(this.net_offset/(last_state.time - previous_state.time)).toFixed(3);

      for(var key in last_state){
        if(!last_state.hasOwnProperty(key)) continue;

        player = this.getPlayer(key);

        last_item = last_state[key];
        previous_item = previous_state[key];
        if(player == null) continue;

        sprite = player.sprite;
        if(last_item.seq <= sprite.last_input_seq) continue;

        if(this.client_smoothing && previous_item) {
          pos = Interpolation.v_lerp({x: sprite.left, y: sprite.top}, Interpolation.v_lerp(previous_item.pos, last_item.pos, smooth), smooth );
          sprite.top = pos.y;
          sprite.left = pos.x;
        }
        else{
          sprite.top = last_item.pos.y;
          sprite.left = last_item.pos.x;
        }
        sprite.heading = last_item.heading;
        last_item.fires.forEach(function(fire){
          sprite.fires.push(new Fire(fire[0], fire[1], fire[2], fire[3]));
        });
        sprite.last_input_seq = last_item.seq;
      }
    },
    onConnect: function(){
      this.socket.on('disconnect', this.onDisconnect.bind(this));
      this.socket.on('message', this.onMessage.bind(this));
      this.socket.on('error', this.onDisconnect.bind(this));
      this.socket.on('oninput', this.onInput.bind(this));
      this.socket.on('onserverupdate', this.onServerUpdate.bind(this));
      this.socket.on('onconnected', this.onConnected.bind(this));
      //socket.emit('my other event', { my: 'data' });

      this.create_ping_timer();
      if(String(window.location).indexOf('debug') != -1) {
        this.create_debug_gui();
      }
    },
    onConnected: function(data) {
      this.clientid = data.id;
    },
    onReadyGameMessage: function(data) {

      var server_time = parseFloat(data);

      this.players.info_color = '#2288cc';
      this.players.self.state = 'YOU ' + this.players.self.state;
      this.socket.send('c#' + this.players.self.color);
    },
    onOtherPlayerJoinGameMessage: function(data) {
      var other_sprite = createSprite('other_sprite', spaceShipPainter, [processInput, checkCollision], {left: data.pos.x, top: data.pos.y, heading: data.heading});
      other_sprite.color = CONSTANT.SPACESHIPCOLOR2;
      this.gameEngine.addSprite(other_sprite);

      var other_player = new GamePlayer(other_sprite, data.id);
      other_player.info_color = '#cc0000';
      other_player.state = 'connected';
      other_player.online = true;

      this.players.other.push(other_player);
    },
    onJoinGameMessage: function(data) {
      var server_time = parseFloat(data);
      
      var self_sprite = createSprite('self_sprite', spaceShipPainter, [handleInput, processInput, checkCollision], {});
      self_sprite.color = CONSTANT.SPACESHIPCOLOR1;
      this.gameEngine.addSprite(self_sprite);

      var self_player = new GamePlayer(self_sprite, this.clientid);
      self_player.info_color = '#cc0000';
      self_player.state = 'connected';
      self_player.online = true;

      this.players.self = self_player;
      this.players.self.info_color = '#cc0000';
    },
    onOtherPlayerDisconnect: function(data){
      var player = this.getPlayer(data.id);
      var sprite = player.sprite;
      
      this.removePlayer(data.id);
      this.gameEngine.removeSprite(sprite);
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
      this.color = 'rgb(25,125,255)',
        //A local timer for precision on server and client
      this.local_time = 0.016;      //The local timer

      this.show_help = false;       //Whether or not to draw the help text
      this.client_predict = false;     //Whether or not the client is predicting input
      this.input_seq = 0;         //When predicting client inputs, we store the last input as a sequence number
      this.client_smoothing = true;     //Whether or not the client side prediction tries to smooth things out
      this.client_smooth = 25;      //amount of smoothing to apply to client update dest

      this.net_latency = 0.001;       //the latency between the client and the server (ping/2)
      this.net_ping = 0.001;        //The round trip time from here to the server,and back
      this.last_ping_time = 0.001;    //The time we last sent a ping
      this.fake_lag = 0;        //If we are simulating lag, this applies only to the input client (not others)

      this.net_offset = 100;        //100 ms latency between server and client interpolation for other clients
      this.buffer_size = 2;         //The size of the server history to keep for rewinding/interpolating.

      this.client_time = 0.01;      //Our local 'clock' based on server time - client interpolation(net_offset).
      this.server_time = 0.01;      //The time the server reported it was at, last we heard from it
    },
    create_debug_gui: function() {
      this.gui = new dat.GUI();
      var _playersettings = this.gui.addFolder('Your settings');
        this.colorcontrol = _playersettings.addColor(this, 'color');
          //We want to know when we change our color so we can tell
          //the server to tell the other clients for us
        this.colorcontrol.onChange(function(value) {
          this.players.self.sprite.color = value;
          localStorage.setItem('color', value);
          this.socket.send('c#' + colorToRGB(value));
        }.bind(this));
        _playersettings.open();
        
      var _othersettings = this.gui.addFolder('Methods');
        _othersettings.add(this, 'client_smoothing').name('运动插值').listen();
        _othersettings.add(this, 'client_smooth').name('插值参数').listen();
        _othersettings.add(this, 'client_predict').name('预先运动').listen();
        _othersettings.open();

      var _debugsettings = this.gui.addFolder('Debug view');
        var show_help = _debugsettings.add(this, 'show_help').name('帮助').listen();
        show_help.onChange(function(){
          if(this.show_help){
            this.gameEngine.startAnimate = function (ctx, time) {
              ctx.save();
              ctx.fillStyle = 'rgba(255,255,255,1)';
              ctx.fillText('net_offset : local offset of others players and their server updates. Players are net_offset "in the past" so we can smoothly draw them interpolated.', 10 , 30);
              ctx.fillText('server_time : last known game time on server', 10 , 70);
              ctx.fillText('client_time : delayed game time on client for other players only (includes the net_offset)', 10 , 90);
              ctx.fillText('net_latency : Time from you to the server. ', 10 , 130);
              ctx.fillText('net_ping : Time from you to the server and back. ', 10 , 150);
              ctx.fillText('fake_lag : Add fake ping/lag for testing, applies only to your inputs (watch server_pos block!). ', 10 , 170);
              ctx.fillText('client_smoothing/client_smooth : When updating players information from the server, it can smooth them out.', 10 , 210);
              ctx.fillText(' This only applies to other clients when prediction is enabled, and applies to local player with no prediction.', 170 , 230);
              ctx.restore();
            };
          }
          else{
            this.gameEngine.startAnimate = function (ctx, time) {};
          }
        }.bind(this) );

        _debugsettings.add(this, 'local_time').name('本地时间').listen();
        _debugsettings.open();

      var _consettings = this.gui.addFolder('Connection');
        _consettings.add(this, 'net_latency').name('延迟').step(0.001).listen();
        _consettings.add(this, 'net_ping').name('ping延迟').step(0.001).listen();
          //When adding fake lag, we need to tell the server about it.
        var lag_control = _consettings.add(this, 'fake_lag').name('延迟模拟').step(0.001).listen();
        lag_control.onChange(function(value){
          this.socket.send('l#' + value);
        }.bind(this));
        _consettings.open();

      var _netsettings = this.gui.addFolder('Networking');
        _netsettings.add(this, 'net_offset').name('网络时差').min(0.01).step(0.001).listen();
        _netsettings.add(this, 'server_time').name('服务器时间').step(0.001).listen();
        _netsettings.add(this, 'client_time').name('客户端时间').step(0.001).listen();
        _netsettings.open();
    },
    create_timer: function(){
      setInterval(function(){
        this.local_time = this.gameEngine.gameTime;
      }.bind(this), 100);
    }

  };
  var createSprite = function(name, painter, update, opts){
    var sprite = new Sprite(name, painter, update);
    sprite.width = CONSTANT.SPACESHIPWIDTH;
    sprite.height = CONSTANT.SPACESHIPHEIGHT;
    sprite.color = CONSTANT.SPACESHIPCOLOR1;

    sprite.top = opts.top || CONSTANT.WORLD_HEIGHT - sprite.height/2;
    sprite.left = opts.left || sprite.width/2;
    sprite.heading = opts.heading || Math.PI/2;
    sprite.score = opts.score || 0;
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

  return GameClient;

});
