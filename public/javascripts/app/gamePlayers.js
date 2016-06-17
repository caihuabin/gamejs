define(function(require, exports, module){
  var Sprite = require('game/sprites').Sprite;
  var CONSTANT = require('./config').CONSTANT;
  var Bullet = require('./gameWeapons').Bullet;

  var SpaceShipPlayer = function(name, painter, behaviors, opts){
    if (name !== undefined)      this.name = name;
    if (painter !== undefined)   this.painter = painter;
    if (behaviors !== undefined) this.behaviors = behaviors;

    this.color = opts.color || CONSTANT.SPACESHIPCOLOR1;
    this.position = opts.position || new Vector(this.width/2, CONSTANT.WORLD_HEIGHT - this.height/2);
    this.vector = opts.vector || new Vector(1, 0);
    this.heading = opts.heading || Math.PI/2;
    this.score = opts.score || 0;

    this.input = {
    	left:false, 
    	right:false, 
    	up: false, 
    	down: false, 
    	mouse: null, 
    	score: false, 
    	damage: false
    };
    this.inputs = [];
    this.input_seq = 0;
    this.last_input_seq = -1;

    this.energy = this.ENERGY_INIT;
    this.radius = CONSTANT.SPACESHIPRADIUS;
    this.primaryWeapons = [];
    this.primaryWeapons["main"] = Bullet;
    this.bullets = [];

    return this;
  };
  extend(SpaceShipPlayer, Sprite, {
  	width: CONSTANT.SPACESHIPWIDTH,
  	height: CONSTANT.SPACESHIPHEIGHT,
  	velocityX: 500,/*pixels/second*/
  	velocityY: 500,
    position_limit: {
      y_min: 0 + CONSTANT.SPACESHIPHEIGHT/2,
      x_min: 0 + CONSTANT.SPACESHIPWIDTH/2,
      y_max: CONSTANT.WORLD_HEIGHT - CONSTANT.SPACESHIPHEIGHT/2,
      x_max: CONSTANT.WORLD_WIDTH - CONSTANT.SPACESHIPWIDTH/2
    },
    hit: false,
    alive: true,
    health: 100000,

    MAX_PLAYER_VELOCITY: 1500.0,
    THRUST_DELAY_MS: 125,
    ENERGY_INIT: 100,
    heading: 0,
    energy: 0,
    primaryWeapons: null,
    thrustRecharge: 0,
    engineThrust: false,
    killedOn: 0,
    bounceWeapons: false,
    frame: 0,
    unThrust: function(){
      this.engineThrust = false;
    },
    damageBy: function(force){
      // record hit - will change enemy colour for a single frame
      this.hit = true;
      if (force === -1 || (this.health -= force) <= 0){
        this.alive = false;
      }
      return !this.alive;
    },
    onDestroyed: function(player)
    {
    }
  });

  exports.SpaceShipPlayer = SpaceShipPlayer;
});