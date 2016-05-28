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
};
var game = new Game('game', 'viewport');
  game.context.canvas.width = window.innerWidth;
  game.context.canvas.height = window.innerHeight;

var game_client = new GameClient();

var interval,
lastKeyListenerTime = 0,
gameOver = false,
overlayDiv = document.getElementById('overlayDiv'),
progressDiv = document.getElementById('progressDiv'),
progressPercentDiv = document.getElementById('progressPercentDiv'),
progressbar = new COREHTML5.Progressbar('rgba(0,0,0,0.5)', 'rgba(100, 130, 250,1)', 80, 20);
progressbar.appendTo(progressDiv);

// 

var spaceShipPainter = {
    engineThrust: false,
    thrust: function(angle){
        this.engineThrust = true;
    },
    paint: function (sprite, context) {
        var spaceShipCanvas = game.getCanvas('spaceShipCanvas');
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
var handle_input = {
    execute: function(sprite, context, time){
        var angle = null;
        if (sprite.input.left)
        {
            sprite.inputs.push({input: 'l', seq: ++sprite.input_seq, time: time});
           if (sprite.input.up) angle = 315;
           else if (sprite.input.down) angle = 225;
           else angle = 270;
        }
        if (sprite.input.right)
        {
            sprite.inputs.push({input: 'r', seq: ++sprite.input_seq, time: time});
           if (sprite.input.up) angle = 45;
           else if (sprite.input.down) angle = 135;
           else angle = 90;
        }
        if (sprite.input.up)
        {
            sprite.inputs.push({input: 'u', seq: ++sprite.input_seq, time: time});
           if (sprite.input.left) angle = 315;
           else if (sprite.input.right) angle = 45;
           else angle = 1;
        }
        if (sprite.input.down)
        {
            sprite.inputs.push({input: 'd', seq: ++sprite.input_seq, time: time});
           if (sprite.input.left) angle = 225;
           else if (sprite.input.right) angle = 135;
           else angle = 181;
        }
        if (!!sprite.input.mouse)
        {
            sprite.inputs.push({input: 'M', data: [sprite.left, sprite.top, sprite.input.mouse.x, sprite.input.mouse.y], seq: ++sprite.input_seq, time: time});
            sprite.input.mouse = null;
        }
        if(sprite.input.score){
            sprite.inputs.push({input: '+', seq: ++sprite.input_seq, time: time});
            sprite.input.score = false;
        }
        if(sprite.input.damage){
            sprite.inputs.push({input: '-', seq: ++sprite.input_seq, time: time});
            sprite.input.damage = false;
        }

        if (angle !== null)
        {
            sprite.inputs.push({input: 'A', data: angle * RAD, seq: ++sprite.input_seq, time: time});
        }
    }
};
var process_input = {
    execute: function(sprite, context, time){
        
        var x_dir = 0;
        var y_dir = 0;
        var heading = null;
        var server_packet = 'i#';
        var server_inputs = [];
        var ic = sprite.inputs.length;
        if(ic) {
            for(var j = 0; j < ic; ++j) {
                    //don't process ones we already have simulated locally
                if(sprite.inputs[j].seq <= sprite.last_input_seq) continue;
                var item = sprite.inputs[j],
                    input = item.input;
                server_inputs.push(item);
                switch (input)
                {
                    case 'l':
                        --x_dir;
                        break;
                    case 'r':
                        ++x_dir;
                        break;
                    case 'u':
                        --y_dir;
                        break;
                    case 'd':
                        ++y_dir;
                        break;
                    case 'M':
                        sprite.fires.push(new Fire(item.data[0], item.data[1], item.data[2], item.data[3]) );
                        game.playSound('shoot2');
                        break;
                    case 'A':
                        sprite.painter.thrust(item.data);
                        heading = item.data;
                        break;
                    case '+':
                        ++sprite.score;
                        break;
                    default :
                        break;
                }
            }
            if(server_inputs.length > 0 && sprite.name === 'self_sprite'){
                server_packet += JSON.stringify(server_inputs);
                game_client.socket.send(server_packet);
            }
            sprite.last_input_time = sprite.inputs[ic-1].time;
            sprite.last_input_seq = sprite.inputs[ic-1].seq;
            sprite.inputs = [];
        }
        //sprite.top += y_dir * game.pixelsPerFrame(time, sprite.velocityY);
        sprite.top += y_dir * sprite.velocityY/60;
        sprite.left += x_dir * sprite.velocityX/60;
        if(heading !== null){
            sprite.heading = heading;
        }

    }
};

var check_collision = {
    execute: function(sprite, context, time){
        if(sprite.top <= sprite.position_limit.top_min) {
            sprite.top = sprite.position_limit.top_min;
        }
        if(sprite.top >= sprite.position_limit.top_max ) {
            sprite.top = sprite.position_limit.top_max;
        }
        if(sprite.left <= sprite.position_limit.left_min) {
            sprite.left = sprite.position_limit.left_min;
        }
        if(sprite.left >= sprite.position_limit.left_max ) {
            sprite.left = sprite.position_limit.left_max;
        }
        if(sprite.heading > Math.PI * 2 || sprite.heading < 0){
            sprite.heading = Math.PI/2;
        }
    }
};

game.initialize = function(){
  var self = this;

  // Key Listeners..............................................

  self.addKeyListener(
     {
        key: 'p',
        listener: function () {
           self.togglePaused();
        }
     }
  );

  self.addKeyListener(
     {
        key: 'right arrow',
        listener: function () {
          var self_sprite = self.getSprite('self_sprite');
          self_sprite.input.right = true;
           var now = +new Date();
           if (now - lastKeyListenerTime > 200) { // throttle
              lastKeyListenerTime = now;
              
           }
        }
     }
  );
  self.addKeyListener(
     {
        key: 'right arrow up',
        listener: function () {
          var self_sprite = self.getSprite('self_sprite');
          self_sprite.input.right = false;
           var now = +new Date();
           if (now - lastKeyListenerTime > 200) { // throttle
              lastKeyListenerTime = now;
              
           }
        }
     }
  );

  self.addKeyListener(
     {
        key: 'left arrow',
        listener: function () {
          var self_sprite = self.getSprite('self_sprite');
          self_sprite.input.left = true;
           var now = +new Date();
           if (now - lastKeyListenerTime > 200) { // throttle
              lastKeyListenerTime = now;
           }
        }
     }
  );
  self.addKeyListener(
     {
        key: 'left arrow up',
        listener: function () {
          var self_sprite = self.getSprite('self_sprite');
          self_sprite.input.left = false;
           var now = +new Date();
           if (now - lastKeyListenerTime > 200) { // throttle
              lastKeyListenerTime = now;
           }
        }
     }
  );
  self.addKeyListener(
     {
        key: 'up arrow',
        listener: function () {
          var self_sprite = self.getSprite('self_sprite');
          self_sprite.input.up = true;
           var now = +new Date();
           if (now - lastKeyListenerTime > 200) { // throttle
              lastKeyListenerTime = now;
           }
        }
     }
  );
  self.addKeyListener(
     {
        key: 'up arrow up',
        listener: function () {
          var self_sprite = self.getSprite('self_sprite');
          self_sprite.input.up = false;
           var now = +new Date();
           if (now - lastKeyListenerTime > 200) { // throttle
              lastKeyListenerTime = now;
           }
        }
     }
  );
  self.addKeyListener(
     {
        key: 'down arrow',
        listener: function () {
          var self_sprite = self.getSprite('self_sprite');
          self_sprite.input.down = true;
           var now = +new Date();
           if (now - lastKeyListenerTime > 200) { // throttle
              lastKeyListenerTime = now;
           }
        }
     }
  );
  self.addKeyListener(
     {
        key: 'down arrow up',
        listener: function () {
          var self_sprite = self.getSprite('self_sprite');
          self_sprite.input.down = false;
           var now = +new Date();
           if (now - lastKeyListenerTime > 200) { // throttle
              lastKeyListenerTime = now;
           }
        }
     }
  );

  self.addMouseListener(
      {
          key: 'mouseclick',
          listener: function (canvas, e) {
              var pos = windowToCanvas(canvas, e);
              var now = +new Date();
              var self_sprite = self.getSprite('self_sprite');
              self_sprite.input.mouse = pos;
              if (now - lastKeyListenerTime > 200) { // throttle
                  lastKeyListenerTime = now;
              }
          }
      }
  );

};

// Game Paint Methods.........................................
   
game.startAnimate = function (ctx, time) {
   
};
game.paintOverSprites = function () {
    var ctx = this.context;
    var sprites = this.sprites;

    CONSTANT.FIRE_HUE += 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    var self_sprite = this.getSprite('self_sprite');

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

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.fillText('Score : ' + self_sprite.score, 1200, 650);
    ctx.restore();
};
   
game.paintUnderSprites = function () {
    paintSpace();
};

// Initialization.............................................

game.queueImage('/images/image1.png');
game.queueImage('/images/image2.png');
game.queueImage('/images/image3.png');

game.queueCanvasFun(
    {
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
    });
game.queueCanvasFun(
    {
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
    });

interval = setInterval( function (e) {
    game.loadImages();
    game.loadCanvasFuns();
    var loadingPercentComplete = game.getLoadingPercentComplete();
    if(loadingPercentComplete === 100){
        clearInterval(interval);

        progressDiv.style.display = 'none';
        overlayDiv.style.display = 'none';

        //game.playSound('manAtWar');
        game.initialize();
        game_client.start();
        //game.start();
    }
    progressbar.draw(loadingPercentComplete);
    progressPercentDiv.innerHTML = Math.floor(loadingPercentComplete) + '%';
}, 16);


var paintSpace = (function(game, CONSTANT){
    var ctx = game.context,
        stars = [],
        hue = CONSTANT.STAR_HUE,
        maxStars = CONSTANT.MAX_STARS,
        w = ctx.canvas.width,
        h = ctx.canvas.height;

    var maxOrbitRadius = maxOrbit(w, h);
    
    /*var starImg = new Image();
    starImg.src = game.getCanvas('starCanvas').toDataURL('image/png');*/

    for (var i = 0; i < maxStars; i++) {
        stars.push(new Star(w, h, maxOrbitRadius, maxStars));
    }

    return function(){
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'hsla(' + hue + ', 64%, 6%, 1)';
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'lighter';
        for (var i = 1, l = stars.length; i < l; i++) {
            stars[i].draw(ctx, game.getCanvas('starCanvas'));
        };
        ctx.restore();
    }
})(game, CONSTANT);

function Star(w, h, maxOrbitRadius, maxStars) {
    this.orbitRadius = randomInt(0, maxOrbitRadius);
    this.radius = randomInt(60, this.orbitRadius) / 12;
    this.orbitX = w / 2;
    this.orbitY = h / 2;
    this.timePassed = randomInt(0, maxStars);
    this.speed = randomInt(0, this.orbitRadius) / 900000;
    this.alpha = randomInt(2, 10) / 10;
}
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
}

function Fire( sx, sy, tx, ty ) {
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
}
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
}
Fire.prototype.hit = function(left, top){
    if((Math.abs(this.left - left) <= CONSTANT.SPACESHIPSIZE) && (Math.abs(this.top - top) <= CONSTANT.SPACESHIPSIZE)){
        return true;
    }
    return false;
}
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

}
Fire.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo( this.coordinates[ this.coordinates.length - 1][ 0 ], this.coordinates[ this.coordinates.length - 1][ 1 ] );
    ctx.lineTo( this.left, this.top );
    ctx.strokeStyle = 'hsl(' + CONSTANT.FIRE_HUE + ', 100%, ' + this.brightness + '%)';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc( this.target_x, this.target_y, this.targetRadius, 0, Math.PI * 2 );
    ctx.stroke();
}