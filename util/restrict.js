exports.isAuthenticated = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        var err = new Error('UnAuthenticated');
        err.status = 401;
        next(err);
    }
};
