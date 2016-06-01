define(function (require) {
  var Game = require('./game');
  var gameEngine = Game.gameEngine;
  var gameClient = Game.gameClient;
  var eventEmitter = require('./config').eventEmitter;

  var spaceShipPainter = require('./gameRender').spaceShipPainter;

  var overlayDiv = document.getElementById('overlayDiv');
  var selectGamesDiv = document.getElementById('selectGamesDiv');

  var selectGames = function(e){
    var button = e.target;
    while(button !== this && !/button/.test(button.className) ){
      button = button.parentNode;
    }
    if(button !== this){
      this.removeEventListener('click', selectGames);
      this.style.display = 'none';
      var server_packet = 'f#' + button.getAttribute('data-gameid');
      eventEmitter.emitEvent('socket-send', [server_packet]);
      
      gameEngine.ready(function(){
        overlayDiv.style.display = 'none';
        gameEngine.playSound('manAtWar');
        spaceShipPainter.spaceShipCanvas = gameEngine.getCanvas('spaceShipCanvas');
        gameEngine.start();
      });
    }
  };
  selectGamesDiv.addEventListener('click', selectGames, false);

  gameEngine.initialize();
  gameClient.start();
});