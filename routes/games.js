var express = require('express');
var router = express.Router();

var game = require('../game/game');
var restrict = require('../util/restrict');

router.get('/', restrict.isAuthenticated, function(req, res, next) {
    var games = game.getAllGames();
    var gameServers = [];
    games.forEach(function(item) {
        gameServers.push({
            gameid: item.gameid,
            player_count: item.players.length,
            player_limit: item.player_limit
        });
    });
    res.render('game', { title: 'GameJs', gameServers: gameServers });
});

module.exports = router;
