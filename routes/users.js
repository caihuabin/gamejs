var express = require('express');
var router = express.Router();

var UUID = require('node-uuid');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/', function (req, res, next) {
    var username = req.body.username;
    var sessionUser = req.session.user;
    
    if(!username){
    	next(new Error('your name is empty!'));
    }
    if(sessionUser){
        if(username !== sessionUser.username){
            res.json({
                status: 'fail',
                error: 'your name is wrong!'
            });
        }
    }
    else{
        req.session.regenerate(function(){
            req.session.user = {
                _id : UUID(),
                username: username,
                time: Date.now()
            };
        });
    }
    res.json({
        status: 'success',
        data: sessionUser
    });
});
router.post('/check', function (req, res, next) {
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
router.get('/logout', function (req, res) {
    req.session.destroy(function(){
        /*res.json({
            status: 'success',
            data: null
        });*/
    });
});

module.exports = router;
