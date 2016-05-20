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
};
var game = new Game('game', 'viewport');

var interval,
lastKeyListenerTime = 0,
gameOver = false,
overlayDiv = document.getElementById('overlayDiv'),
progressDiv = document.getElementById('progressDiv'),
progressPercentDiv = document.getElementById('progressPercentDiv'),
progressbar = new COREHTML5.Progressbar('rgba(0,0,0,0.5)', 'rgba(100, 130, 250,1)', 80, 20);
progressbar.appendTo(progressDiv);

// 
game.context.canvas.width = window.innerWidth;
game.context.canvas.height = window.innerHeight;

var stopWatch = new Stopwatch();
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
            ctx.fillStyle = sprite.name === 'player1' ? CONSTANT.SPACESHIPCOLOR1 : CONSTANT.SPACESHIPCOLOR2;
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
        var x_dir = 0;
        var y_dir = 0;
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
        if (angle !== null)
        {
            sprite.heading = angle*RAD;
            sprite.painter.thrust(angle);
        }

        var ic = sprite.inputs.length;
        if(ic) {
            for(var j = 0; j < ic; ++j) {
                    //don't process ones we already have simulated locally
                if(sprite.inputs[j].seq <= sprite.last_input_seq) continue;
                var input = sprite.inputs[j].input;
                    if(input == 'l') {
                        x_dir -= 1;
                    }
                    if(input == 'r') {
                        x_dir += 1;
                    }
                    if(input == 'd') {
                        y_dir += 1;
                    }
                    if(input == 'u') {
                        y_dir -= 1;
                    }
            }
            sprite.last_input_time = sprite.inputs[ic-1].time;
            sprite.last_input_seq = sprite.inputs[ic-1].seq;
        }
        sprite.top += y_dir * game.pixelsPerFrame(time, sprite.velocityY);
        sprite.left += x_dir * game.pixelsPerFrame(time, sprite.velocityX);
        
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
    }
};

var player1 = new Sprite('player1', spaceShipPainter, [handle_input, check_collision]);
player1.width = CONSTANT.SPACESHIPWIDTH;
player1.height = CONSTANT.SPACESHIPHEIGHT;

player1.top = CONSTANT.WORLD_HEIGHT - player1.height/2;
player1.left = player1.width/2;

player1.input = {left:false, right:false, up: false, down: false};
player1.inputs = [];
player1.input_seq = 0;
player1.last_input_seq = -1;
player1.position_limit = {
    top_min: 0 + player1.height/2,
    left_min: 0 + player1.width/2,
    top_max: CONSTANT.WORLD_HEIGHT - player1.height/2,
    left_max: CONSTANT.WORLD_WIDTH - player1.width/2
};
player1.velocityX = player1.velocityY = 500; // pixels/second

player1.heading = Math.PI/2;
game.addSprite(player1);

var player2 = new Sprite('player2', spaceShipPainter, []);
player2.left = player2.top = 500;
player2.heading = Math.PI*1.25;
game.addSprite(player2);
// Game Paint Methods.........................................
   
game.startAnimate = function () {
   paintSpace();
};
game.paintOverSprites = function () {
};
   
game.paintUnderSprites = function () { // Draw things other than sprites
};
// Key Listeners..............................................

game.addKeyListener(
   {
      key: 'p',
      listener: function () {
         game.togglePaused();
      }
   }
);

game.addKeyListener(
   {
      key: 'right arrow',
      listener: function () {
        player1.input.right = true;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
            
         }
      }
   }
);
game.addKeyListener(
   {
      key: 'right arrow up',
      listener: function () {
        player1.input.right = false;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
            
         }
      }
   }
);

game.addKeyListener(
   {
      key: 'left arrow',
      listener: function () {
        player1.input.left = true;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);
game.addKeyListener(
   {
      key: 'left arrow up',
      listener: function () {
        player1.input.left = false;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);
game.addKeyListener(
   {
      key: 'up arrow',
      listener: function () {
        player1.input.up = true;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);
game.addKeyListener(
   {
      key: 'up arrow up',
      listener: function () {
        player1.input.up = false;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);
game.addKeyListener(
   {
      key: 'down arrow',
      listener: function () {
        player1.input.down = true;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);

game.addMouseListener(
   {
      key: 'mousedown',
      listener: function (e) {
        player1.input.mouse = true;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);
game.addKeyListener(
   {
      key: 'down arrow up',
      listener: function () {
        player1.input.down = false;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);
game.addMouseListener(
   {
      key: 'mouseup',
      listener: function (e) {
        player1.input.mouse = false;
         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);
game.addMouseListener(
   {
      key: 'mousemove',
      listener: function (canvas, e) {
        var pos = windowToCanvas(canvas, e);

         var now = +new Date();
         if (now - lastKeyListenerTime > 200) { // throttle
            lastKeyListenerTime = now;
         }
      }
   }
);

// Initialization.............................................

game.queueImage('/images/image1.png');
game.queueImage('/images/image2.png');
game.queueImage('/images/image3.png');
game.queueImage('/images/image4.png');
game.queueImage('/images/image5.png');


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

        game.playSound('manAtWar');

        game.start();
    }
    progressbar.draw(loadingPercentComplete);
    progressPercentDiv.innerHTML = Math.floor(loadingPercentComplete) + '%';
}, 16);


var paintSpace = (function(document, game, CONSTANT){
    var gameContext = game.context,
        stars = [],
        hue = CONSTANT.STAR_HUE,
        maxStars = CONSTANT.MAX_STARS,
        w = gameContext.canvas.width,
        h = gameContext.canvas.height;

    /*var starImg = new Image();
    starImg.src = game.getCanvas('starCanvas').toDataURL('image/png');*/

    
    function maxOrbit(x, y) {
        var max = Math.max(x, y),
            diameter = Math.round(Math.sqrt(max * max * 2));
        return diameter / 2;
    }

    var maxOrbitRadius = maxOrbit(w, h);

    var Star = function(ctx, w, h) {
        this.ctx = ctx;
        this.orbitRadius = randomInt(0, maxOrbitRadius);
        this.radius = randomInt(60, this.orbitRadius) / 12;
        this.orbitX = w / 2;
        this.orbitY = h / 2;
        this.timePassed = randomInt(0, maxStars);
        this.speed = randomInt(0, this.orbitRadius) / 900000;
        this.alpha = randomInt(2, 10) / 10;
    }

    Star.prototype.draw = function() {
        var x = Math.sin(this.timePassed) * this.orbitRadius + this.orbitX,
            y = Math.cos(this.timePassed) * this.orbitRadius + this.orbitY,
            twinkle = randomInt(0, 10);

        if (twinkle === 1 && this.alpha > 0) {
            this.alpha -= 0.05;
        } 
        else if (twinkle === 2 && this.alpha < 1) {
            this.alpha += 0.05;
        }

        this.ctx.globalAlpha = this.alpha;
        this.ctx.drawImage(game.getCanvas('starCanvas'), x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);
        this.timePassed += this.speed;
    }

    for (var i = 0; i < maxStars; i++) {
        stars.push(new Star(gameContext, w, h));
    }

    return function(){
        gameContext.save();
        gameContext.globalCompositeOperation = 'source-over';
        gameContext.globalAlpha = 0.8;
        gameContext.fillStyle = 'hsla(' + hue + ', 64%, 6%, 1)';
        gameContext.fillRect(0, 0, w, h);

        gameContext.globalCompositeOperation = 'lighter';
        for (var i = 1, l = stars.length; i < l; i++) {
            stars[i].draw();
        };
        gameContext.restore();
    }
})(document, game, CONSTANT);

function windowToCanvas(canvas, e) {
   var x = e.x || e.clientX,
       y = e.y || e.clientY,
       bbox = canvas.getBoundingClientRect();

   return { x: x - bbox.left * (canvas.width  / bbox.width),
            y: y - bbox.top  * (canvas.height / bbox.height)
          };
}