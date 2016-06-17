define(function(require, exports, module){

  var GameEngine = require('game/gameEngine');
  var GameScene = require('./gameScene');
  var GameClient = require('./gameClient');

  var gameEngine = new GameEngine('gamejs', 'viewport');
  var gameScene = new GameScene();
  gameEngine.initialize = function(){
    var self = this;
    var lastKeyListenerTime = 0,
        gameOver = false;
    var CONSTANT = require('./config').CONSTANT;
    var GameRender = require('./gameRender'),
        SpaceShipCanvas = GameRender.SpaceShipCanvas,
        EnemyShipCanvasA = GameRender.EnemyShipCanvasA,
        EnemyShipCanvasB = GameRender.EnemyShipCanvasB,
        EnemyShipCanvasC = GameRender.EnemyShipCanvasC,
        EnemyShipCanvasD = GameRender.EnemyShipCanvasD,
        EnemyShipCanvasE = GameRender.EnemyShipCanvasE,
        EnemyShipCanvasF = GameRender.EnemyShipCanvasF,
        EnemyShipCanvasG = GameRender.EnemyShipCanvasG,
        EnemyShipCanvasH = GameRender.EnemyShipCanvasH,

        StarCanvas = GameRender.StarCanvas,
        paintSpace = GameRender.paintSpace,
        paintScore = GameRender.paintScore;
    var gameUtil = require('game/util'),
        windowToCanvas = gameUtil.windowToCanvas;

    var eventEmitter = require('./config').eventEmitter;
    //var self_sprite = self.getSprite('self_sprite');

    self.context.canvas.width = CONSTANT.WORLD_WIDTH;
    self.context.canvas.height = CONSTANT.WORLD_HEIGHT;

    // Initialization.............................................

    self.queueImage('/images/image1.jpg');
    self.queueImage('/images/image2.jpg');
    self.queueImage('/images/image3.jpg');

    self.queueCanvasFun(StarCanvas);
    self.queueCanvasFun(SpaceShipCanvas);
    self.queueCanvasFun(EnemyShipCanvasA);
    self.queueCanvasFun(EnemyShipCanvasB);
    self.queueCanvasFun(EnemyShipCanvasC);
    self.queueCanvasFun(EnemyShipCanvasD);
    self.queueCanvasFun(EnemyShipCanvasE);
    self.queueCanvasFun(EnemyShipCanvasF);
    self.queueCanvasFun(EnemyShipCanvasG);
    self.queueCanvasFun(EnemyShipCanvasH);

    eventEmitter.addListener('play-sound', function(sound){
      self.playSound(sound);
    });

    // Game Paint Methods.........................................
       
    self.startAnimate = function (ctx, time) {
      
    };

    self.paintOverSprites = function (time) {
      var ctx = this.context;
      var sprites = this.sprites;
      var self_sprite = this.getSprite('self_sprite');
      paintScore(ctx, self_sprite.score, time);

      gameScene.animate(self_sprite, ctx, sprites, time);
    };

    self.paintUnderSprites = function (time) {
      var starCanvas = this.getCanvas('starCanvas'),
          ctx = this.context;
      paintSpace(ctx, starCanvas, time);
    };
    // Key Listeners..............................................
    self.addKeyListener({
      key: 'p',
      listener: function () {
        self.togglePaused();
      }
    });

    self.addKeyListener({
      key: 'right arrow',
      listener: function () {
        var self_sprite = self.getSprite('self_sprite');
        self_sprite.input.right = true;
        var now = +new Date();
        if (now - lastKeyListenerTime > 200) { // throttle
          lastKeyListenerTime = now;
        }
      }
    });
    self.addKeyListener({
      key: 'right arrow up',
      listener: function () {
        var self_sprite = self.getSprite('self_sprite');
        self_sprite.input.right = false;
        var now = +new Date();
        if (now - lastKeyListenerTime > 200) { // throttle
          lastKeyListenerTime = now;
        }
      }
    });

    self.addKeyListener({
      key: 'left arrow',
      listener: function () {
        var self_sprite = self.getSprite('self_sprite');
        self_sprite.input.left = true;
        var now = +new Date();
        if (now - lastKeyListenerTime > 200) { // throttle
          lastKeyListenerTime = now;
        }
      }
    });

    self.addKeyListener({
      key: 'left arrow up',
      listener: function () {
        var self_sprite = self.getSprite('self_sprite');
        self_sprite.input.left = false;
        var now = +new Date();
        if (now - lastKeyListenerTime > 200) { // throttle
          lastKeyListenerTime = now;
        }
      }
    });

    self.addKeyListener({
      key: 'up arrow',
      listener: function () {
        var self_sprite = self.getSprite('self_sprite');
        self_sprite.input.up = true;
        var now = +new Date();
        if (now - lastKeyListenerTime > 200) { // throttle
          lastKeyListenerTime = now;
        }
      }
    });

    self.addKeyListener({
      key: 'up arrow up',
      listener: function () {
        var self_sprite = self.getSprite('self_sprite');
        self_sprite.input.up = false;
        var now = +new Date();
        if (now - lastKeyListenerTime > 200) { // throttle
          lastKeyListenerTime = now;
        }
      }
    });

    self.addKeyListener({
      key: 'down arrow',
      listener: function () {
        var self_sprite = self.getSprite('self_sprite');
        self_sprite.input.down = true;
        var now = +new Date();
        if (now - lastKeyListenerTime > 200) { // throttle
          lastKeyListenerTime = now;
        }
      }
    });

    self.addKeyListener({
      key: 'down arrow up',
      listener: function () {
        var self_sprite = self.getSprite('self_sprite');
        self_sprite.input.down = false;
        var now = +new Date();
        if (now - lastKeyListenerTime > 200) { // throttle
          lastKeyListenerTime = now;
        }
      }
    });

    self.addMouseListener({
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
    });
  };
  gameEngine.ready = function(callback){
    var progressBar = document.getElementById('progressbar'),
        progressExpand = document.getElementById('expand');
        
    progressBar.style.display = 'block';
    var interval = setInterval( function (e) {
      gameEngine.loadImages();
      gameEngine.loadCanvasFuns();
      var loadingPercentComplete = gameEngine.getLoadingPercentComplete();
      if(loadingPercentComplete === 100){
        clearInterval(interval);
        setTimeout(function(){
          progressBar.style.display = 'none';
          (typeof callback === 'function') && callback();
        },2000);
      }
      progressExpand.style.width = loadingPercentComplete + '%';
    }, 16);

  };
  var gameClient = new GameClient(gameEngine);
  exports.gameEngine = gameEngine;
  exports.gameClient = gameClient;
  exports.gameScene = gameScene;

});
