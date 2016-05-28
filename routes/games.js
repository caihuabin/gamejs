var express = require('express');
var router = express.Router();

var game = require('../game/game');
var restrict = require('../util/restrict');

router.get('/', restrict.isAuthenticated, function(req, res, next) {
  res.render('game', { title: 'GameJs' });
});

router.get('/available', restrict.isAuthenticated, function(req, res, next) {
  var games = game.getAvailableGames();
  res.json({ games: games[0].gameid });
});

module.exports = router;