define(function(require, exports, module){
  var Config = require('./config');
  var CONSTANT = Config.CONSTANT;
  var eventEmitter = Config.eventEmitter;
  var gameUtil = require('game/util');
  var maxOrbit = gameUtil.maxOrbit;
  var EnemyBullet = require('./gameWeapons').EnemyBullet;

  var spaceShipPainter = {
    spaceShipCanvas: null,
    paint: function (sprite, context) {
      var spaceShipCanvas = this.spaceShipCanvas;
      var ctx = context;
      
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(sprite.position.x, sprite.position.y);
        ctx.scale(0.75, 0.75);
        ctx.rotate(sprite.heading);
        ctx.translate(0, -4);
        ctx.globalAlpha = 0.4 + Rnd() * 0.5;
        ctx.fillStyle = sprite.color;
        ctx.beginPath();
        ctx.moveTo(-12, 20);
        ctx.lineTo(12, 20);
        if (sprite.engineThrust)
        {
          ctx.lineTo(0, 50 + Rnd() * 80);
          sprite.unThrust();
        }
        else{
          ctx.lineTo(0, 50 + Rnd() * 50);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
      ctx.save();
      ctx.translate(sprite.position.x, sprite.position.y);
      ctx.scale(0.75, 0.75);
      ctx.rotate(sprite.heading);
      ctx.translate(0, -4);
      ctx.shadowBlur = 8;
      ctx.shadowColor = CONSTANT.SPACESHIPSHADOW;
      ctx.drawImage(spaceShipCanvas, spaceShipCanvas.width * -0.5, spaceShipCanvas.width * -0.5);
      ctx.restore();
    }
  };
  var enemyShipPainter = {
    enemyShipCanvases: null,
    update: function(sprite, self_sprite, enemyBullets){
      var self_player = self_sprite;
      if(sprite.position.y <= sprite.position_limit.y_min) {
        sprite.vector.y = -sprite.vector.y;
      }
      if(sprite.position.y >= sprite.position_limit.y_max ) {
        sprite.vector.y = -sprite.vector.y;
      }
      if(sprite.position.x <= sprite.position_limit.x_min) {
        sprite.vector.x = -sprite.vector.x;
      }
      if(sprite.position.x >= sprite.position_limit.x_max ) {
        sprite.vector.x = -sprite.vector.x;
      }

      switch (sprite.type){
        case 'A':
          // DUMBO: change direction randomly
          if (Rnd() < 0.01){
            sprite.vector.y = -(sprite.vector.y + (0.35 - Rnd()));
          }
          break;
        case 'B':
          // ZONER: randomly reorientate towards player ("perception level")
          // so player can avade by moving around them
          if (Rnd() < 0.05){
            // head towards player - generate a vector pointed at the player
            // by calculating a vector between the player and enemy positions
            var v = self_player.position.nsub(sprite.position);
            // scale resulting vector down to fixed vector size i.e. speed
            sprite.vector = v.scaleTo(3);
          }
          break;
        case 'C':
          // TRACKER: very perceptive and faster - this one is mean
          if (Rnd() < 0.25){
            var v = self_player.position.nsub(sprite.position);
            sprite.vector = v.scaleTo(5.5);
          }

          break;
        case 'D':
          // BORG: randomly very fast dash towards player, otherwise it slows down
          if (Rnd() < 0.03){
            var v = self_player.position.nsub(sprite.position);
            sprite.vector = v.scaleTo(8);
          }
          else{
            sprite.vector.scale(0.95);
          }
          break;
        case 'E':
          // DODGER: perceptive and fast - and tries to dodgy bullets!
          var dodged = false;
          // if we are close to the player then don't try and dodge,
          // otherwise enemy might dash away rather than go for the kill
          if (self_player.position.nsub(sprite.position).length() > 150){
            var p = sprite.position,
                r = sprite.radius + 50;  // bullet "distance" perception
              // look at player bullets list - are any about to hit?
            for (var i=0, j=self_player.bullets.length, bullet, n; i < j; i++){
              bullet = self_player.bullets[i];
              // test the distance against the two radius combined
              if (bullet.position.distance(p) <= bullet.radius + r){
                // if so attempt a fast sideways dodge!
                var v = bullet.position.nsub(p).scaleTo(7);
                // randomise dodge direction a bit
                v.rotate((n = Rnd()) < 0.5 ? n*PIO4 : -n*PIO4).invert();
                sprite.vector = v;
                dodged = true;
                break;
              }
            }
          }
          if (!dodged && Rnd() < 0.04){
            var v = self_player.position.nsub(sprite.position);
            sprite.vector = v.scaleTo(5.5);
          }
          break;
        case 'F':
          // SPLITTER: moves towards player - splits into 2 smaller versions when destroyed
          if (Rnd() < 0.05){
            var v = self_player.position.nsub(sprite.position);
            sprite.vector = v.scaleTo(3.5);
          }
          break;
        case 'G':
          // BOMBER: if we are too near the player move away
          //         if we are too far from the player move towards
          //         - then slowing down into a firing position
          var v = self_player.position.nsub(sprite.position);
          if (v.length() > 400){
            // move closer
            if (Rnd() < 0.08) sprite.vector = v.scaleTo(6);
          }
          else if (v.length() < 350){
            // move away
            if (Rnd() < 0.08) sprite.vector = v.invert().scaleTo(6);
          }
          else{
            // slow down into a firing position
            var frameStart = Date.now();
            sprite.vector.scale(0.85);
            // reguarly fire at the player
            if (frameStart - sprite.bulletRecharge > sprite.BULLET_RECHARGE && self_player.alive){
              
              eventEmitter.emitEvent('play-sound', ['enemy-bomb']);
              // update last fired frame and generate a bullet
              sprite.bulletRecharge = frameStart;
              // generate a vector pointed at the player
              // by calculating a vector between the player and enemy positions
              // then scale to a fixed size - i.e. bullet speed
              var v = self_player.position.nsub(sprite.position).scaleTo(8);
              // slightly randomize the direction to apply some accuracy issues
              v.x += (Rnd() * 2 - 1);
              v.y += (Rnd() * 2 - 1);
              var bullet = new EnemyBullet(sprite.position.clone(), v, 10);
              enemyBullets.push(bullet);
            }
          }
          break;
        case 'H':
          // SPLITTER: - mini version
          if (Rnd() < 0.04){
            var v = self_player.position.nsub(sprite.position);
            sprite.vector = v.scaleTo(6);
          }
          break;
      }
    },
    paint: function (sprite, context) {
      var enemyShipCanvas = this.enemyShipCanvases[sprite.type];
      var ctx = context;
      
      ctx.save();
      ctx.translate(sprite.position.x, sprite.position.y);
      if (sprite.hit)
      {
        // double render in "lighter" mode for a retro weapon hit effect
        ctx.globalCompositeOperation = "lighter";
        sprite.unHit();
      }
      ctx.drawImage(enemyShipCanvas, enemyShipCanvas.width * -0.5, enemyShipCanvas.width * -0.5);
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
  // Dumbo: blue stretched cubiod
  var EnemyShipCanvasA = {
    name: 'enemyShipCanvasA', 
    fun: function(){
      var enemyShipCanvas = document.createElement('canvas'),
        enemyShipCtx = enemyShipCanvas.getContext('2d');

      enemyShipCanvas.width = 64;
      enemyShipCanvas.height = 64;
      var k3d = new K3D.RequestAnimController(enemyShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
        drawmode = "wireframe";
        shademode = "depthcue";
        depthscale = 28;
        linescale = 3;
        perslevel = 256;
        color = [0,128,255];
        addphi = -0.75;
        addgamma = -0.50;
        init(
          [{x:-20,y:-20,z:12}, {x:-20,y:20,z:12}, {x:20,y:20,z:12}, {x:20,y:-20,z:12}, {x:-10,y:-10,z:-12}, {x:-10,y:10,z:-12}, {x:10,y:10,z:-12}, {x:10,y:-10,z:-12}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:0}, {a:4,b:5}, {a:5,b:6}, {a:6,b:7}, {a:7,b:4}, {a:0,b:4}, {a:1,b:5}, {a:2,b:6}, {a:3,b:7}],
          []);
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return enemyShipCanvas;
    }
  };
  // Zoner: yellow diamond
  var EnemyShipCanvasB = {
    name: 'enemyShipCanvasB', 
    fun: function(){
      var enemyShipCanvas = document.createElement('canvas'),
        enemyShipCtx = enemyShipCanvas.getContext('2d');

      enemyShipCanvas.width = 64;
      enemyShipCanvas.height = 64;
      var k3d = new K3D.RequestAnimController(enemyShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
        drawmode = "wireframe";
        shademode = "depthcue";
        depthscale = 28;
        linescale = 3;
        perslevel = 256;
        color = [255,255,0];
        addphi = 0.35;
        addgamma = -0.35;
        addtheta = -0.75;
        init(
          [{x:-20,y:-20,z:0}, {x:-20,y:20,z:0}, {x:20,y:20,z:0}, {x:20,y:-20,z:0}, {x:0,y:0,z:-20}, {x:0,y:0,z:20}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:0}, {a:0,b:4}, {a:1,b:4}, {a:2,b:4}, {a:3,b:4}, {a:0,b:5}, {a:1,b:5}, {a:2,b:5}, {a:3,b:5}],
          []);
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return enemyShipCanvas;
    }
  };
  // Tracker: red flattened square
  var EnemyShipCanvasC = {
    name: 'enemyShipCanvasC', 
    fun: function(){
      var enemyShipCanvas = document.createElement('canvas'),
        enemyShipCtx = enemyShipCanvas.getContext('2d');

      enemyShipCanvas.width = 64;
      enemyShipCanvas.height = 64;
      var k3d = new K3D.RequestAnimController(enemyShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
        drawmode = "wireframe";
        shademode = "depthcue";
        depthscale = 28;
        linescale = 3;
        perslevel = 256;
        color = [255,96,0];
        addtheta = 0.75;
        init(
          [{x:-20,y:-20,z:5}, {x:-20,y:20,z:5}, {x:20,y:20,z:5}, {x:20,y:-20,z:5}, {x:-15,y:-15,z:-5}, {x:-15,y:15,z:-5}, {x:15,y:15,z:-5}, {x:15,y:-15,z:-5}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:0}, {a:4,b:5}, {a:5,b:6}, {a:6,b:7}, {a:7,b:4}, {a:0,b:4}, {a:1,b:5}, {a:2,b:6}, {a:3,b:7}],
          []);
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return enemyShipCanvas;
    }
  };
  // Borg: big green cube
  var EnemyShipCanvasD = {
    name: 'enemyShipCanvasD', 
    fun: function(){
      var enemyShipCanvas = document.createElement('canvas'),
        enemyShipCtx = enemyShipCanvas.getContext('2d');

      enemyShipCanvas.width = 128;
      enemyShipCanvas.height = 128;
      var k3d = new K3D.RequestAnimController(enemyShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
        drawmode = "wireframe";
        shademode = "depthcue";
        linescale = 3;
        perslevel = 256;
        color = [0,255,64];
        depthscale = 96;
        addphi = -1.0;
        init(
          [{x:-40,y:-40,z:40}, {x:-40,y:40,z:40}, {x:40,y:40,z:40}, {x:40,y:-40,z:40}, {x:-40,y:-40,z:-40}, {x:-40,y:40,z:-40}, {x:40,y:40,z:-40}, {x:40,y:-40,z:-40}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:0}, {a:4,b:5}, {a:5,b:6}, {a:6,b:7}, {a:7,b:4}, {a:0,b:4}, {a:1,b:5}, {a:2,b:6}, {a:3,b:7}],
          []);
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return enemyShipCanvas;
    }
  };
  // Dodger: small cyan cube
  var EnemyShipCanvasE = {
    name: 'enemyShipCanvasE', 
    fun: function(){
      var enemyShipCanvas = document.createElement('canvas'),
        enemyShipCtx = enemyShipCanvas.getContext('2d');

      enemyShipCanvas.width = 64;
      enemyShipCanvas.height = 64;
      var k3d = new K3D.RequestAnimController(enemyShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
        drawmode = "wireframe";
        shademode = "depthcue";
        depthscale = 28;
        linescale = 3;
        perslevel = 256;
        color = [0,255,255];
        addphi = 0.35; 
        addtheta = -2.0;
        init(
          [{x:-20,y:-20,z:20}, {x:-20,y:20,z:20}, {x:20,y:20,z:20}, {x:20,y:-20,z:20}, {x:-20,y:-20,z:-20}, {x:-20,y:20,z:-20}, {x:20,y:20,z:-20}, {x:20,y:-20,z:-20}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:0}, {a:4,b:5}, {a:5,b:6}, {a:6,b:7}, {a:7,b:4}, {a:0,b:4}, {a:1,b:5}, {a:2,b:6}, {a:3,b:7}],
          []);
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return enemyShipCanvas;
    }
  };
  // Dodger: small cyan cube
  var EnemyShipCanvasF = {
    name: 'enemyShipCanvasF', 
    fun: function(){
      var enemyShipCanvas = document.createElement('canvas'),
        enemyShipCtx = enemyShipCanvas.getContext('2d');

      enemyShipCanvas.width = 64;
      enemyShipCanvas.height = 64;
      var k3d = new K3D.RequestAnimController(enemyShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
        drawmode = "wireframe";
        shademode = "depthcue";
        linescale = 3;
        perslevel = 256;
        color = [148,0,255];
        depthscale = 56;  // tweak for larger object
        addphi = 2.0;
        init(
          [{x:-30,y:-20,z:0}, {x:0,y:-20,z:30}, {x:30,y:-20,z:0}, {x:0,y:-20,z:-30}, {x:0,y:30,z:0}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:0}, {a:0,b:4}, {a:1,b:4}, {a:2,b:4}, {a:3,b:4}],
          []);
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return enemyShipCanvas;
    }
  };
  // Dodger: small cyan cube
  var EnemyShipCanvasG = {
    name: 'enemyShipCanvasG', 
    fun: function(){
      var enemyShipCanvas = document.createElement('canvas'),
        enemyShipCtx = enemyShipCanvas.getContext('2d');

      enemyShipCanvas.width = 64;
      enemyShipCanvas.height = 64;
      var k3d = new K3D.RequestAnimController(enemyShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
        drawmode = "wireframe";
        shademode = "depthcue";
        linescale = 3;
        perslevel = 256;
        color = [255,0,255];
        depthscale = 56;
        addgamma = -3.5;
        init(
          [{x:-30,y:-30,z:10}, {x:-30,y:30,z:10}, {x:30,y:30,z:10}, {x:30,y:-30,z:10}, {x:-15,y:-15,z:-15}, {x:-15,y:15,z:-15}, {x:15,y:15,z:-15}, {x:15,y:-15,z:-15}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:0}, {a:4,b:5}, {a:5,b:6}, {a:6,b:7}, {a:7,b:4}, {a:0,b:4}, {a:1,b:5}, {a:2,b:6}, {a:3,b:7}],
          []);
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return enemyShipCanvas;
    }
  };
  // Splitter-mini: see Splitter above
  var EnemyShipCanvasH = {
    name: 'enemyShipCanvasH', 
    fun: function(){
      var enemyShipCanvas = document.createElement('canvas'),
        enemyShipCtx = enemyShipCanvas.getContext('2d');

      enemyShipCanvas.width = 64;
      enemyShipCanvas.height = 64;
      var k3d = new K3D.RequestAnimController(enemyShipCanvas);
      var obj = new K3D.K3DObject();
      with (obj)
      {
        drawmode = "wireframe";
        shademode = "depthcue";
        depthscale = 16;  // tweak for smaller object
        linescale = 3;
        perslevel = 256;
        color = [148,0,255];
        addphi = 3.5;
        init(
          [{x:-15,y:-10,z:0}, {x:0,y:-10,z:15}, {x:15,y:-10,z:0}, {x:0,y:-10,z:-15}, {x:0,y:15,z:0}],
          [{a:0,b:1}, {a:1,b:2}, {a:2,b:3}, {a:3,b:0}, {a:0,b:4}, {a:1,b:4}, {a:2,b:4}, {a:3,b:4}],
          []);
      }
      k3d.addK3DObject(obj);
      k3d.paused = false;
      k3d.frame();

      return enemyShipCanvas;
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

  exports.spaceShipPainter = spaceShipPainter;
  exports.enemyShipPainter = enemyShipPainter;

  exports.Star = Star;

  exports.StarCanvas = StarCanvas;
  exports.SpaceShipCanvas = SpaceShipCanvas;
  exports.EnemyShipCanvasA = EnemyShipCanvasA;
  exports.EnemyShipCanvasB = EnemyShipCanvasB;
  exports.EnemyShipCanvasC = EnemyShipCanvasC;
  exports.EnemyShipCanvasD = EnemyShipCanvasD;
  exports.EnemyShipCanvasE = EnemyShipCanvasE;
  exports.EnemyShipCanvasF = EnemyShipCanvasF;
  exports.EnemyShipCanvasG = EnemyShipCanvasG;
  exports.EnemyShipCanvasH = EnemyShipCanvasH;

  exports.paintSpace = paintSpace;
  exports.paintScore = paintScore;
});