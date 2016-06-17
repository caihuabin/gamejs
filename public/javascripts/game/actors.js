define(function(require, exports, module) {
  var Actor = function(p, v){
    this.position = p;
    this.vector = v;
    return this;
  };
  Actor.prototype = {
    position: null,
    vector: null,
    alive: true,
    radius: 0,
    expired: function expired(){
      return !(this.alive);
    },
    hit: function hit(force){
      this.alive = false;
      return true;
    },
    worldToScreen: function(ctx, world, radius){
      var viewposition = Game.worldToScreen(this.position, world, radius);
      if (viewposition){
        // scale ALL graphics... - translate to position apply canvas scaling
        ctx.translate(viewposition.x, viewposition.y);
        ctx.scale(world.scale, world.scale);
      }
      return viewposition;
    },
    checkExtent: function(world){
      return (this.position.x + this.radius < world.x_max
              && this.position.x - this.radius > world.x_min 
              && this.position.y + this.radius < world.y_max
              && this.position.y - this.radius > world.y_min);
    },
    update: function update(){
    },
    render: function render(ctx, world){
    }
  };

  var EffectActor = function(p, v, lifespan){
    EffectActor.superclass.constructor.call(this, p, v);
    this.lifespan = lifespan;
    this.effectStart = Date.now();
    return this;
  };
   
  extend(EffectActor, Actor,{
    /**
     * Effect lifespan in ms
     */
    lifespan: 0,
      
    /**
     * Effect start time
     */
    effectStart: 0,
      
    /**
     * Actor expiration test
     * 
     * @return true if expired and to be removed from the actor list, false if still in play
     */
    expired: function expired(){
      // test to see if the effect has expired
      return (Date.now() - this.effectStart > this.lifespan);
    },
    
    /**
     * Helper to return a value multiplied by the ratio of the remaining lifespan with an optional
     * offset within which to apply the ratio.
     * 
     * @param val     value to apply to the ratio of remaining lifespan
     * @param offset  optional offset at which to begin applying the ratio
     */
    effectValue: function effectValue(val, offset){
      if (!offset) offset = this.lifespan;
      var rem = this.lifespan - (Date.now() - this.effectStart),
          result = val;
      if (rem < offset){
        result = (val / offset) * rem;
        // this is not a simple counter - so we need to crop the value
        // as the time between frames is not determinate
        if (result < 0) result = 0;
        else if (result > val) result = val;
      }
      return result;
    }
  });

  exports.Actor = Actor;
  exports.EffectActor = EffectActor;
});
