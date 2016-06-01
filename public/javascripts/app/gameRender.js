define(function(require, exports, module){
  var CONSTANT = require('./config').CONSTANT;
  var gameUtil = require('game/util');
  var maxOrbit = gameUtil.maxOrbit;

  var spaceShipPainter = {
    spaceShipCanvas: null,
    engineThrust: false,
    thrust: function(angle){
      this.engineThrust = true;
    },
    paint: function (sprite, context) {
      var spaceShipCanvas = this.spaceShipCanvas;
      var ctx = context;
      
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(sprite.left, sprite.top);
        ctx.scale(0.75, 0.75);
        ctx.rotate(sprite.heading);
        ctx.translate(0, -4);
        ctx.globalAlpha = 0.4 + Rnd() * 0.5;
        ctx.fillStyle = sprite.color;
        ctx.beginPath();
        ctx.moveTo(-12, 20);
        ctx.lineTo(12, 20);
        if (this.engineThrust)
        {
          ctx.lineTo(0, 50 + Rnd() * 80);
          this.engineThrust = false;
        }
        else{
          ctx.lineTo(0, 50 + Rnd() * 50);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
      ctx.save();
      ctx.translate(sprite.left, sprite.top);
      ctx.scale(0.75, 0.75);
      ctx.rotate(sprite.heading);
      ctx.translate(0, -4);
      ctx.shadowBlur = 8;
      ctx.shadowColor = CONSTANT.SPACESHIPSHADOW;
      ctx.drawImage(spaceShipCanvas, spaceShipCanvas.width * -0.5, spaceShipCanvas.width * -0.5);
      ctx.restore();
    }
  };

  var Star = function(w, h, maxOrbitRadius, maxStars) {
    this.orbitRadius = randomInt(0, maxOrbitRadius);
    this.radius = randomInt(60, this.orbitRadius) / 12;
    this.orbitX = w / 2;
    this.orbitY = h / 2;
    this.timePassed = randomInt(0, maxStars);
    this.speed = randomInt(0, this.orbitRadius) / 900000;
    this.alpha = randomInt(2, 10) / 10;
  };
  Star.prototype.draw = function(ctx, starImg) {
    var x = Math.sin(this.timePassed) * this.orbitRadius + this.orbitX,
        y = Math.cos(this.timePassed) * this.orbitRadius + this.orbitY,
        twinkle = randomInt(0, 10);

    if (twinkle === 1 && this.alpha > 0) {
      this.alpha -= 0.05;
    } 
    else if (twinkle === 2 && this.alpha < 1) {
      this.alpha += 0.05;
    }

    ctx.globalAlpha = this.alpha;
    ctx.drawImage(starImg, x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);
    this.timePassed += this.speed;
  };

  var Fire = function( sx, sy, tx, ty ) {
    this.left = sx;
    this.top = sy;

    this.start_x = sx;
    this.start_y = sy;

    this.target_x = tx;
    this.target_y = ty;

    this.isEnd = false;
    // track the past coordinates of each firework to create a trail effect, increase the coordinate count to create more prominent trails
    this.coordinates = [];
    this.coordinateCount = 3;
    // populate initial coordinate collection with the current coordinates
    while( this.coordinateCount-- ) {
      this.coordinates.push( [ this.left, this.top ] );
    }
    this.angle = Math.atan2( ty - sy, tx - sx );
    this.speed = 2;
    this.acceleration = 1.05;
    this.brightness = randomInt( 50, 70 );
    // circle target indicator radius
    this.targetRadius = 1;
  };
  Fire.prototype.end = function(){
    if(this.angle < 0){
      if(this.top <= this.target_y){
        this.isEnd = true;
      }
    }
    else{
      if(this.top >= this.target_y){
        this.isEnd = true;
      }
    }
    
    return this.isEnd;
  };
  Fire.prototype.hit = function(left, top){
    if((Math.abs(this.left - left) <= CONSTANT.SPACESHIPSIZE) && (Math.abs(this.top - top) <= CONSTANT.SPACESHIPSIZE)){
      return true;
    }
    return false;
  };
  Fire.prototype.update = function() {
    this.coordinates.pop();
    this.coordinates.unshift( [ this.left, this.top ] );

    if( this.targetRadius < 8 ) {
      this.targetRadius += 0.3;
    } else {
      this.targetRadius = 1;
    }
    this.speed *= this.acceleration;
    var vx = Math.cos( this.angle ) * this.speed,
      vy = Math.sin( this.angle ) * this.speed;

    this.left += vx;
    this.top += vy;

  };
  Fire.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo( this.coordinates[ this.coordinates.length - 1][ 0 ], this.coordinates[ this.coordinates.length - 1][ 1 ] );
    ctx.lineTo( this.left, this.top );
    ctx.strokeStyle = 'hsl(' + CONSTANT.FIRE_HUE + ', 100%, ' + this.brightness + '%)';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc( this.target_x, this.target_y, this.targetRadius, 0, Math.PI * 2 );
    ctx.stroke();
  };

  var StarCanvas = {
    name: 'starCanvas', 
    fun: function(){
      var starCanvas = document.createElement('canvas'),
        starCtx = starCanvas.getContext('2d'),
        hue = CONSTANT.STAR_HUE;
      starCanvas.width = 100;
      starCanvas.height = 100;
      var half = starCanvas.width / 2,
        gradient = starCtx.createRadialGradient(half, half, 0, half, half, half);
      gradient.addColorStop(0.025, '#fff');
      gradient.addColorStop(0.1, 'hsl(' + hue + ', 61%, 33%)');
      gradient.addColorStop(0.25, 'hsl(' + hue + ', 64%, 6%)');
      gradient.addColorStop(1, 'transparent');
      starCtx.fillStyle = gradient;
      starCtx.beginPath();
      starCtx.arc(half, half, half, 0, Math.PI * 2);
      starCtx.fill();
      return starCanvas;
    }
  };

  var SpaceShipCanvas = {
    name: 'spaceShipCanvas', 
    fun: function(){
      var spaceShipCanvas = document.createElement('canvas'),
        spaceShipCtx = spaceShipCanvas.getContext('2d');

      spaceShipCanvas.width = 64;
      spaceShipCanvas.height = 64;
      var k3d = new K3D.RequestAnimController(spaceShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
         drawmode = "wireframe";
         shademode = "depthcue";
         depthscale = 28;
         linescale = 3.5;
         perslevel = 256;
         color = [255,255,255];
         addphi = -1.0;
         scale = 0.8;
         init(
          [{x:-30,y:-15,z:0}, {x:-10,y:-25,z:15}, {x:10,y:-25,z:15}, {x:30,y:-15,z:0}, {x:10,y:-25,z:-15}, {x:-10,y:-25,z:-15}, {x:0,y:40,z:0}, {x:0,y:5,z:15}, {x:0,y:5,z:-15}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:4}, {a:4,b:5}, {a:5,b:0}, {a:1,b:7}, {a:7,b:2}, {a:5,b:8}, {a:8,b:4}, {a:7,b:6}, {a:6,b:8}, {a:0,b:6}, {a:3,b:6}, {a:1,b:5}, {a:2,b:4}],
          []
         );
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return spaceShipCanvas;
    }
  };

  var paintSpace = (function(CONSTANT, Star){
    var stars = [],
        hue = CONSTANT.STAR_HUE,
        maxStars = CONSTANT.MAX_STARS;
    var w = CONSTANT.WORLD_WIDTH,
        h = CONSTANT.WORLD_HEIGHT;
    var maxOrbitRadius = maxOrbit(w, h);
    
    /*var starImg = new Image();
    starImg.src = gameEngine.getCanvas('starCanvas').toDataURL('image/png');*/

    for (var i = 0; i < maxStars; i++) {
      stars.push(new Star(w, h, maxOrbitRadius, maxStars));
    }

    return function(ctx, starCanvas){
      var w = ctx.canvas.width,
          h = ctx.canvas.height;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = 'hsla(' + hue + ', 64%, 6%, 1)';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      for (var i = 1, l = stars.length; i < l; i++) {
        stars[i].draw(ctx, starCanvas);
      };
      ctx.restore();
    }
  })(CONSTANT, Star);

  var paintScore = function(ctx, score){
    ctx.save();
    ctx.fillStyle = CONSTANT.SCORE_COLOR;
    ctx.fillText('Score : ' + score, 1200, 650);
    ctx.restore();
  };

  var paintFire = function(ctx, sprites){
  	CONSTANT.FIRE_HUE += 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    sprites.forEach(function(sprite){
      var fires = sprite.fires,
        i = fires.length-1,
        hit = false;
      while(i > -1){
        fires[i].draw(ctx);
        fires[i].update();

        for(var j = 0; j < sprites.length; j++){
          if(sprites[j] !== sprite){
            hit = fires[i].hit(sprites[j].left, sprites[j].top);
            if(hit){
              sprites[j].input.damage = true;
              sprite.input.score = true;
            }
          }
        }

        (hit || fires[i].end()) && fires.splice( i, 1 );
        --i;
      }
    });
    ctx.restore();
  };

  exports.spaceShipPainter = spaceShipPainter;

  exports.Star = Star;
  exports.Fire = Fire;

  exports.StarCanvas = StarCanvas;
  exports.SpaceShipCanvas = SpaceShipCanvas;

  exports.paintSpace = paintSpace;
  exports.paintFire = paintFire;
  exports.paintScore = paintScore;
});