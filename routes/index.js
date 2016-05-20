var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/test', function(req, res, next) {
  res.render('test', { title: 'GameJs' });
});
router.get('/game', function(req, res, next) {
  res.render('game', { title: 'GameJs' });
});

module.exports = router;
