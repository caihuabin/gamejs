define(function(require, exports, module){
  var EffectActor = require('game/actors').EffectActor;
  var CONSTANT = require('./config').CONSTANT;

  var Bullet = function(sx, sy, tx, ty){
    var p = new Vector(sx, sy),
        v = new Vector(0, 0);

    Bullet.superclass.constructor.call(this, p, v, this.BULLET_LIFESPAN);

    this.radius = this.BULLET_RADIUS;

    this.start_x = sx;
    this.start_y = sy;

    this.target_x = tx;
    this.target_y = ty;

    this.isEnd = false;
    this.coordinates = [];
    this.coordinateCount = 3;
    // populate initial coordinate collection with the current coordinates
    while( this.coordinateCount-- ) {
      this.coordinates.push( [ this.position.x, this.position.y ] );
    }

    this.heading = this.angle = Math.atan2( ty - sy, tx - sx );
    this.speed = 2;
    this.acceleration = 1.05;
    this.brightness = randomInt( 50, 70 );
    // circle target indicator radius
    this.targetRadius = 1;

    return this;
  };
  extend(Bullet, EffectActor,{
    BULLET_RADIUS: 12,
    BULLET_LIFESPAN: 750,
    FADE_LENGTH: 125,
    heading: 0,
    powerLevel: 1,
    alive: true,
    update: function(){
      this.coordinates.pop();
      this.coordinates.unshift( [ this.position.x, this.position.y ] );

      if( this.targetRadius < 8 ) {
        this.targetRadius += 0.3;
      } else {
        this.targetRadius = 1;
      }
      this.speed *= this.acceleration;
      var vx = Math.cos( this.angle ) * this.speed,
        vy = Math.sin( this.angle ) * this.speed;
      this.vector.x = vx;
      this.vector.y = vy;
    },
    render: function(ctx){
      ctx.save();
      //ctx.globalAlpha = this.effectValue(1.0, this.FADE_LENGTH);
      ctx.globalCompositeOperation = 'lighter';
      
      ctx.beginPath();
      ctx.moveTo( this.coordinates[ this.coordinates.length - 1][ 0 ], this.coordinates[ this.coordinates.length - 1][ 1 ] );
      ctx.lineTo( this.position.x, this.position.y );
      ctx.strokeStyle = 'hsl(' + CONSTANT.BULLET_HUE + ', 100%, ' + this.brightness + '%)';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc( this.target_x, this.target_y, this.targetRadius, 0, Math.PI * 2 );
      ctx.stroke();

      ctx.restore();
    },
    end: function(){
      if(this.angle < 0){
        if(this.position.y <= this.target_y){
          this.isEnd = true;
        }
      }
      else{
        if(this.position.y >= this.target_y){
          this.isEnd = true;
        }
      }
      //this.position.distance({x: this.start_x, y: this.start_y}) >= this.distance
      return this.isEnd;
    },
    expired: function(){
      return !(this.alive) || this.end();
    },
    power: function power(){
      return this.powerLevel;
    }
  });

  var EnemyBullet = function(p, v, power){
    EnemyBullet.superclass.constructor.call(this, p, v, this.BULLET_LIFESPAN);
    this.powerLevel = this.playerDamage = power;
    this.radius = this.BULLET_RADIUS;
    return this;
  };
  extend(EnemyBullet, EffectActor,{
    BULLET_LIFESPAN: 1250,
    BULLET_RADIUS: 10,
    FADE_LENGTH: 200,
    powerLevel: 0,
    playerDamage: 0,
    
    /**
     * Bullet rendering method
     * 
     * @param ctx {object} Canvas rendering context
     * @param world {object} World metadata
     */
    render: function(ctx, world, frameTime){
      var frameCount = frameTime % 1000 * 60;
      ctx.save();
      // TODO: double up + shadow in prerender phase to avoid "lighter" here...
      ctx.globalCompositeOperation = "lighter";
      if (this.checkExtent(world) && Date.now() - this.effectStart > 25){
        ctx.globalAlpha = this.effectValue(1.0, this.FADE_LENGTH);
        // TODO: prerender this! (with shadow...)
        ctx.fillStyle = CONSTANT.BULLET_ENEMY;
        ctx.translate(this.position.x, this.position.y);
        var rad = this.BULLET_RADIUS - 2;
        ctx.beginPath();
        ctx.arc(0, 0, (rad-1 > 0 ? rad-1 : 0.1), 0, TWOPI, true);
        ctx.closePath();
        ctx.fill();
        ctx.rotate((frameCount % 1800) / 5);
        ctx.beginPath();
        ctx.moveTo(rad * 2, 0);
        for (var i=0; i<7; i++){
          ctx.rotate(PIO4);
          if (i%2 === 0){
            ctx.lineTo((rad * 2 / 0.5) * 0.2, 0);
          }
          else{
            ctx.lineTo(rad * 2, 0);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },
    power: function(){
      return this.powerLevel;
    }
  });
  exports.Bullet = Bullet;
  exports.EnemyBullet = EnemyBullet;
});
