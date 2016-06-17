define(function(require){
  var EventEmitter = require('EventEmitter');

  var CONSTANT = {
    STAR_HUE: 217,
    MAX_STARS: 500,
    SPACESHIPCOLOR1: 'rgb(25,125,255)',
    SPACESHIPCOLOR2: 'rgb(255,25,25)',
    SPACESHIPSHADOW: 'rgb(255,255,255)',
    WORLD_WIDTH: window.innerWidth,
    WORLD_HEIGHT: window.innerHeight,
    SPACESHIPWIDTH: 64,
    SPACESHIPHEIGHT: 64,
    SPACESHIPRADIUS: 32,
    SPACESHIPSIZE: 32,
    BULLET_HUE: 120,

    SCORE_COLOR: 'rgba(255,255,255,1)',

    ShadowSize: 8,

    PLAYER: "rgb(255,255,255)",
    PLAYER_THRUST: "rgb(25,125,255)",
    PARTICLE: "rgb(255,150,75)",
    EXPLOSION: "rgb(255,120,40)",
    ENEMY_DUMBO: "rgb(0,128,255)",
    ENEMY_TRACKER: "rgb(255,96,0)",
    ENEMY_ZONER: "rgb(255,255,0)",
    ENEMY_BORG: "rgb(0,255,64)",
    ENEMY_DODGER: "rgb(0,255,255)",
    ENEMY_SPLITTER: "rgb(148,0,255)",
    ENEMY_BOMBER: "rgb(255,0,255)",
    ENEMY_VENOM: "rgb(255,128,64)",
    COLLECTABLE_MULTIPLIER: "rgb(255,180,0)",
    COLLECTABLE_ENERGY: "rgb(100,255,0)",
    BULLET_ENEMY: "rgb(150,255,150)"
  };
  var eventEmitter = new EventEmitter();

  return {CONSTANT: CONSTANT, eventEmitter: eventEmitter};
});
