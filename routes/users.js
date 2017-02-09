var express = require('express');
var router = express.Router();
var UUID = require('node-uuid');

var redisClient = require('../util/redisClient');
var hash = require('../util/hash').hash;
var config = require('../config');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/', function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var cache_key = 'user' + username;

    if (!username || !password) {
        return next(new Error('your name is empty!'));
    }

    redisClient.getItem(cache_key, function(err, data) {
        if (err) {
            return next(err);
        }
        if (data) {
            hash(password, config.salt, function(err, pass) {
                if (err) return next(err);
                if (pass === data.password) {
                    req.session.regenerate(function() {
                        req.session.user = {
                            _id: data._id,
                            username: data.username,
                            time: data.time
                        };
                        res.redirect('/games');
                    });
                } else {
                    return next(new Error('invalid password'));
                }
            });
        } else {
            var data = {
                _id: UUID(),
                username: username,
                password: password,
                time: Date.now()
            };
            hash(data.password, config.salt, function(err, pass) {
                if (err) {
                    return next(err);
                } else {
                    data.password = pass;
                    redisClient.setItem(cache_key, data, redisClient.defaultExpired, function(err) {
                        if (err) {
                            console.log('error:' + err.message);
                        } else {
                            req.session.regenerate(function() {
                                req.session.user = {
                                    _id: data._id,
                                    username: data.username,
                                    time: data.time
                                };
                                res.redirect('/games');
                            });
                        }
                    });
                }
            });


        }
    });

});
router.post('/check', function(req, res, next) {
    if (req.session.user) {
        res.json({
            isCheck: true,
            user: req.session.user
        });
    } else {
        res.json({
            isCheck: false,
            user: null
        });
    }
});
router.get('/logout', function(req, res) {
    req.session.destroy(function() {
        /*res.json({
            status: 'success',
            data: null
        });*/
    });
});

module.exports = router;
