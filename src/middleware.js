module.exports = function () {
    var middleware = {
        checkLoggedIn: function (req, res, next) {
            if (req.cookies.user || req.cookies.admin) {
                return next();
            }

            return res.redirect('/login');
        },
        checkClient: function (req, res, next) {
            if (req.cookies.isClient || req.cookies.admin) {
                return next();
            }
            return next({status: 403, message: 'Forbidden'});
        },
        checkAdmin: function (req, res, next) {
            if (req.cookies.admin) {
                return next();
            }
            return next({status: 403, message: 'Forbidden'});
        },
        checkLoggedOut: function (req, res, next) {
            if (req.cookies.user) {
                return res.redirect('/');
            }

            next();
        }
    };

    return middleware;
};
