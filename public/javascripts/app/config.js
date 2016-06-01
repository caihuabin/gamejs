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
    SPACESHIPSIZE: 32,
    FIRE_HUE: 120,

    SCORE_COLOR: 'rgba(255,255,255,1)'
  };
  var eventEmitter = new EventEmitter();

  return {CONSTANT: CONSTANT, eventEmitter: eventEmitter};
});
