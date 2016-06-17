define(function(require, exports, module){
  var Actors = require('game/actors');
  var Actor = Actors.Actor;
  var EffectActor = Actors.EffectActor;
  var CONSTANT = require('./config').CONSTANT;

  var Particle = function(position, vector, size, type, lifespan, fadelength, color){
    this.position = position;
    this.vector = vector;
    this.size = size;
    this.type = type;
    this.lifespan = lifespan;
    this.fadelength = fadelength;
    this.color = color || CONSTANT.PARTICLE;
   
    // randomize rotation speed and angle for line particle
    if (type === 1){
      this.rotate = Rnd() * TWOPI;
      this.rotationv = (Rnd() - 0.5) * 0.5;
    }
    this.effectStart = Date.now();
    
    this.effectValue = function(val){
      var result = val - ((val / this.lifespan) * (Date.now() - this.effectStart));
      if (result < 0) result = 0;
      else if (result > val) result = val;
      return result;
    };
    
    this.update = function(){
      this.position.add(this.vector);
      return (Date.now() - this.effectStart < this.lifespan);
    };
    
    this.render = function(ctx){
      ctx.globalAlpha = this.effectValue(1.0);
      switch (this.type){
        case 0:  // point
          ctx.globalCompositeOperation = "lighter";
          var index = this.size,
              offset = -(this.size + 4),
              size = 4+index*2,
              width = size << 1,
              radgrad = ctx.createRadialGradient(size, size, size >> 1, size, size, size);  
          radgrad.addColorStop(0, this.color);
          radgrad.addColorStop(1, "#000");
          ctx.fillStyle = radgrad;
          ctx.translate(offset, offset);
          ctx.fillRect(0, 0, width, width);
          break;
        case 1:  // line
          // prerendered images - fixed WxH of 8x32 - for each enemy and player color
          var width = 8, 
              height = 32;
          ctx.rotate(this.rotate);
          ctx.translate(8, ~~(32 * (this.size/10)) );
          ctx.translate(4, 8);

          this.rotate += this.rotationv;

          ctx.shadowBlur = CONSTANT.ShadowSize;
          ctx.shadowColor = ctx.strokeStyle = this.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(width/2, 2);
          ctx.lineTo(width/2, height-2-1);
          ctx.closePath();
          ctx.stroke();
          
          break;
        case 2:  // smudge
          // prerendered images in a single fixed color
          ctx.globalCompositeOperation = "lighter";
          var index = this.size-2,
              offset = -((this.size - 2) * 4 + 4),
              size = (index+1)*8
              width = size << 1,
              radgrad = ctx.createRadialGradient(size, size, size >> 3, size, size, size);  
          radgrad.addColorStop(0, CONSTANT.EXPLOSION);
          radgrad.addColorStop(1, "#000");

          ctx.translate(offset, offset);
          ctx.fillStyle = radgrad;
          ctx.fillRect(0, 0, width, width);
          break;
      }
    };
  };

  var Particles = function(p, v, count, fnEmitter){
    Particles.superclass.constructor.call(this, p, v);
    // generate particles based on the supplied emitter function
    this.particles = new Array(count);
    for (var i=0; i<count; i++){
       this.particles[i] = fnEmitter.call(this, i);
    }
    return this;
  };
  extend(Particles, Actor,{
    particles: null,
    render: function(ctx, world){
      ctx.save();
      for (var i=0, particle, viewposition; i<this.particles.length; i++){
        particle = this.particles[i];
        // update particle and test for lifespan
        if (particle.update()){
          ctx.save();
          //ctx.translate(viewposition.x, viewposition.y);
          ctx.translate(particle.position.x, particle.position.y);
          //ctx.scale(world.scale, world.scale);
          particle.render(ctx);
          ctx.restore();
        }
        else{
          // particle no longer alive, remove from list
          this.particles.splice(i, 1);
        }
      }
      ctx.restore();
    },
    expired: function expired(){
      return (this.particles.length === 0);
    }
  });
  var EnemyExplosion = function(p, v, enemy){
    EnemyExplosion.superclass.constructor.call(this, p, v, 20, function(i){
      // randomise start position slightly
      var pos = p.clone();
      pos.x += randomInt(-5, 5);
      pos.y += randomInt(-5, 5);
      // randomise radial direction vector - speed and angle, then add parent vector
      var ptype = randomInt(0,2);
      switch (ptype){
        case 0:
          var t = new Vector(0, randomInt(12, 15));
          t.rotate(Rnd() * TWOPI);
          t.add(v);
          return new Particle(pos, t, ~~(Rnd() * 4), 0, 1000, 300);
          break;
        case 1:
          var t = new Vector(0, randomInt(2, 5));
          t.rotate(Rnd() * TWOPI);
          t.add(v);
          // create line particle - size based on enemy type
          return new Particle(pos, t, (enemy.type !== 'D' ? Rnd() * 5 + 5 : Rnd() * 10 + 10), 1, 1000, 300, enemy.colorRGB);
          break;
        case 2:
          var t = new Vector(0, randomInt(1, 3));
          t.rotate(Rnd() * TWOPI);
          t.add(v);
          return new Particle(pos, t, ~~(Rnd() * 4 + 4), 2, 1000, 300);
          break;
      }
    });
    return this;
  };
  
  extend(EnemyExplosion, Particles);

  var EnemyImpact = function(p, v, enemy){
      EnemyImpact.superclass.constructor.call(this, p, v, 5, function(){
        // slightly randomise vector angle - then add parent vector
        var t = new Vector(0, Rnd() < 0.5 ? randomInt(-3, -8) : randomInt(3, 8));
        t.rotate(Rnd() * PIO2 - PIO4);
        t.add(v);
        return new Particle(p.clone(), t, ~~(Rnd() * 4), 0, 750, 250, enemy.colorRGB);
      });
      return this;
  };
   
  extend(EnemyImpact, Particles);

  var BulletImpactEffect = function(p, v, enemy){
    BulletImpactEffect.superclass.constructor.call(this, p, v, 3, function(){
      return new Particle(p.clone(), v.nrotate(Rnd()*PIO8), ~~(Rnd() * 4), 0, 500, 200);
    });
    return this;
  };
  
  extend(BulletImpactEffect, Particles);

  var PlayerExplosion = function(p, v){
    PlayerExplosion.superclass.constructor.call(this, p, v, 20, function(){
      // randomise start position slightly
      var pos = p.clone();
      pos.x += randomInt(-5, 5);
      pos.y += randomInt(-5, 5);
      // randomise radial direction vector - speed and angle, then add parent vector
      switch (randomInt(1,2)){
        case 1:
          var t = new Vector(0, randomInt(3, 5));
          t.rotate(Rnd() * TWOPI);
          t.add(v);
          return new Particle(pos, t, Rnd() * 5 + 5, 1, 1000, 300, CONSTANT.PLAYER);
        case 2:
          var t = new Vector(0, randomInt(3, 8));
          t.rotate(Rnd() * TWOPI);
          t.add(v);
          return new Particle(pos, t, ~~(Rnd() * 4 + 4), 2, 1000, 300);
      }
    });
    return this;
  };
   
  extend(PlayerExplosion, Particles);

  var TextIndicator = function(p, v, msg, textSize, color, fadeLength){
      var flength = (fadeLength ? fadeLength : this.DEFAULT_FADE_LENGTH);
      TextIndicator.superclass.constructor.call(this, p, v, flength);
      this.msg = msg;
      if (textSize) this.textSize = textSize;
      if (color) this.color = color;
      return this;
  };
   
  extend(TextIndicator, EffectActor,{
    DEFAULT_FADE_LENGTH: 500,
    textSize: 22,
    msg: null,
    color: "white",
    render: function(ctx, world){
      ctx.save();
      ctx.globalAlpha = this.effectValue(1.0);
      ctx.fillStyle = this.color;
      ctx.font = this.textSize + 'pt Courier New';
      ctx.fillText(this.msg, this.position.x, this.position.y);
      ctx.restore();
    },
    update: function(){
    }
  });

  var ScoreIndicator = function(p, v, score, textSize, prefix, color, fadeLength){
    var msg = score.toString();
    if (prefix){
      msg = prefix + ' ' + msg;
    }
    ScoreIndicator.superclass.constructor.call(this, p, v, msg, textSize, color, fadeLength);
    return this;
  };
  extend(ScoreIndicator, TextIndicator,{});

  exports.EnemyExplosion = EnemyExplosion;
  exports.EnemyImpact = EnemyImpact;
  exports.BulletImpactEffect = BulletImpactEffect;
  exports.PlayerExplosion = PlayerExplosion;
  exports.ScoreIndicator = ScoreIndicator;

});