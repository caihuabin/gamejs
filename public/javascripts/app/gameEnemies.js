define(function(require, exports, module){
  var Actor = require('game/actors').Actor;
  var CONSTANT = require('./config').CONSTANT;
  var enemyShipPainter = require('./gameRender').enemyShipPainter;

  var Enemy = function(name, painter, behaviors, opts){
    if (name !== undefined)      this.name = name;
    if (painter !== undefined)   this.painter = painter;
    if (behaviors !== undefined) this.behaviors = behaviors;

    this.type = opts && opts.type ? opts.type : 'A';

    this.position = new Vector(Rnd() * CONSTANT.WORLD_WIDTH, Rnd() * CONSTANT.WORLD_HEIGHT);
    this.vector = new Vector(4.0 * (Rnd() < 0.5 ? 1 : -1), 4.0 * (Rnd() < 0.5 ? 1 : -1));
    
    switch(this.type){
      case 'A':
        this.scoretype = 1;
        this.radius = 22;
        this.playerDamage = 10;
        this.colorRGB = CONSTANT.ENEMY_DUMBO;
        break;
      case 'B':
        this.scoretype = 2;
        this.radius = 22;
        this.playerDamage = 10;
        this.colorRGB = CONSTANT.ENEMY_ZONER;
        break;
      case 'C':
        this.scoretype = 3;
        this.radius = 22;
        this.health = 2;
        this.playerDamage = 15;
        this.colorRGB = CONSTANT.ENEMY_TRACKER;
        break;
      case 'D':
        this.scoretype = 4;
        this.radius = 52;
        this.health = 5;
        this.playerDamage = 25;
        this.colorRGB = CONSTANT.ENEMY_BORG;
        break;
      case 'E':
        this.scoretype = 5;
        this.radius = 25;
        this.health = 2;
        this.playerDamage = 10;
        this.colorRGB = CONSTANT.ENEMY_DODGER;
        break;
      case 'F':
        this.scoretype = 6;
        this.radius = 25;
        this.health = 3;
        this.playerDamage = 20;
        this.colorRGB = CONSTANT.ENEMY_SPLITTER;
        break;
      case 'G':
        this.scoretype = 7;
        this.radius = 28;
        this.health = 5;
        this.playerDamage = 20;
        this.colorRGB = CONSTANT.ENEMY_BOMBER;
        break;
      case 'H':
        this.scoretype = 4;    // override default score type setting
        this.dropsMutliplier = false;
        this.radius = 12;
        this.health = 1;
        this.playerDamage = 5;
        this.colorRGB = CONSTANT.ENEMY_SPLITTER;
        break;
    }
  };
  extend(Enemy, Actor, {
    BULLET_RECHARGE: 1500,
    SPAWN_LENGTH: 500,
    velocity: 50,/*pixels/second*/
    state: null,         // TODO: replace this with anim state machine
    createdTime: 0,
    type: 'A',
    scoretype: 0,
    dropsMutliplier: true,
    health: 1,
    colorRGB: null,
    playerDamage: 0,
    bulletRecharge: 0,
    hit: false, // TODO: replace with state? - "extends" default render state...?
    alive: true,
    frame: 0,
    position_limit: {
      y_min: 0 + CONSTANT.SPACESHIPHEIGHT/2,
      x_min: 0 + CONSTANT.SPACESHIPWIDTH/2,
      y_max: CONSTANT.WORLD_HEIGHT - CONSTANT.SPACESHIPHEIGHT/2,
      x_max: CONSTANT.WORLD_WIDTH - CONSTANT.SPACESHIPWIDTH/2
    },
    unHit: function(){
      this.hit = false;
    },
    expired: function(){
      return !(this.alive);
    },
    render: function(context){
      this.painter.paint(this, context);
    },
    update: function(self_sprite, enemyBullets){
      this.painter.update(this, self_sprite, enemyBullets);
    },
    damageBy: function(force){
       this.hit = true;
       if (force === -1 || (this.health -= force) <= 0)
       {
          this.alive = false;
       }
       return !this.alive;
    },
    onDestroyed: function(scene){
      if (this.type === 'F'){
        // Splitter enemy divides into two smaller ones
        var enemy = new Enemy(
          'enemy' + Math.random(), 
          enemyShipPainter,
          null,
          {
            type: 'H'
          });
        // update position and vector
        // TODO: move this as option in constructor
        enemy.vector = this.vector.nrotate(PIO2);
        enemy.position = this.position.nadd(enemy.vector);
        scene.enemies.push(enemy);
        
        enemy = new Enemy(
          'enemy' + Math.random(), 
          enemyShipPainter,
          null,
          {
            type: 'H'
          });
        enemy.vector = this.vector.nrotate(-PIO2);
        enemy.position = this.position.nadd(enemy.vector);
        scene.enemies.push(enemy);
      }
    }
  });
  exports.Enemy = Enemy;

});