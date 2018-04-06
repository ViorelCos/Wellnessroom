const bcrypt = require('bcrypt');
const uuid = require('uuid');
const request = require('request');
const {OAuth2Client} = require('google-auth-library');

const User = require('../db/user');
const Client = require('../db/client');

const mailerService = require('../mailer');
const common = require('../common');

const cookieOptions = common.cookieOptions;

module.exports = function (options) {
    const mailer = mailerService(options);

    return {
        signup: signup,
        signupUser: signupUser,
        login: login,
        socialLogin: socialLogin,
        logout: logout,
        postRequestPasswordReset: postRequestPasswordReset,
        postResetPassword: postResetPassword,
        getUsers: getUsers,
        getUsersById: getUsersById,
        patchUsers: patchUsers,
        deleteUsers: deleteUsers
    };

    function signup (req, res, next) {
        doSignup(req, res, next, false, (err, savedUser) => {
            if (err) {
                return next(err);
            }

            (new Client({
                userId: savedUser._id,
                services: []
            })).save()
                .then(() => {
                    mailer.sendActivationLink(req.get('host'), savedUser.email, savedUser._id, req.body.planId, err => {
                        if (err) {
                            return next(err);
                        }

                        res.json('OK');
                    });
                })
                .catch(err => next(err));
        });
    }

    function signupUser (req, res, next) {
        doSignup(req, res, next, true, (err, savedUser) => {
            if (err) {
                return next(err);
            }

            res.cookie('user', savedUser._id, cookieOptions);
            res.cookie('name', savedUser.fullname, cookieOptions);
            res.cookie('isClient', false, cookieOptions);

            res.json(savedUser);
        });
    }

    function doSignup (req, res, next, active, cb) {
        request.post('https://www.google.com/recaptcha/api/siteverify', {
            form: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: req.body.recaptchaResponse
            },
            json: true
        }, (err, response, body) => {
            if (err) {
                return next(err);
            }

            if (!body.success) {
                return next(new Error('ReCaptcha Verification failed.'));
            }

            bcrypt.genSalt((err, salt) => {
                if (err) {
                    return next(err);
                }

                bcrypt.hash(req.body.password, salt, function(err, hash) {
                    if (err) {
                        return next(err);
                    }

                    const user = new User({
                        fullname: req.body.fullname,
                        email: req.body.email,
                        active: active,
                        passwordHash: hash,
                        newUsersCanBook: true
                    });

                    user.save()
                        .then(cb.bind(null, null))
                        .catch(err => next(err));
                });
            });
        });
    }

    function login (req, res, next) {
        const email = req.body.email;
        const password = req.body.password;

        User.findOne({
            email: email,
            active: true
        }, (err, user) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return next(new Error('Invalid username or password'));
            }

            bcrypt.compare(password, user.passwordHash, function(err, result) {
                if (err) {
                    return next(err);
                }

                if (!result) {
                    return next(new Error('Invalid username or password'));
                }

                Client.findOne({
                    userId: user._id
                }, (err, client) => {
                    if (err) {
                        return next(err);
                    }

                    res.cookie('user', user._id, cookieOptions);
                    res.cookie('name', user.fullname, cookieOptions);
                    res.cookie('isClient', !!client, cookieOptions);

                    res.json(user);
                });
            });
        });
    }

    function socialLogin (req, res, next) {
        User.count({
            email: req.body.email,
            socialId: {
                $exists: false
            }
        }, (err, count) => {
            if (err) {
                return next(err);
            }

            if (count > 0) {
                return next(new Error('User with your email has already registered. Please use the password created for your email to login.'));
            }

            const client = new OAuth2Client(options.GOOGLE_CLIENT_ID);
            async function verify() {
                if (req.body.provider === 'google') {
                    const ticket = await client.verifyIdToken({
                        idToken: req.body.idToken,
                        audience: options.GOOGLE_CLIENT_ID
                    });

                    const payload = ticket.getPayload();

                    return payload;
                }

                if (req.body.provider === 'facebook') {
                    return new Promise((resolve, reject) => {
                        var meEndpointUrl = 'https://graph.facebook.com/me?access_token=' + req.body.token;

                        request.get({
                            url: meEndpointUrl,
                            json:true
                        }, function(err, resp, body) {
                            if (err) {
                                return reject(err);
                            }

                            resolve(body);
                        });
                    });
                }
            }

            verify().then(result => {
                if (result.error) {
                    return next(result.error);
                }

                User.findOne({
                    email: req.body.email
                }, (err, user) => {
                    if (err) {
                        return next(err);
                    }

                    if (!user) { // Register
                        (new User({
                            fullname: req.body.name,
                            email: req.body.email,
                            socialId: req.body.uid,
                            active: true,
                            newUsersCanBook: true
                        })).save((err, user) => {
                            if (err) {
                                return next(err);
                            }

                            if (req.params.hcp) {
                                (new Client({
                                    userId: user._id,
                                    services: []
                                })).save()
                                    .then(() => {
                                        mailer.sendActivationLink(req.get('host'), user.email, user._id, req.body.planId, err => {
                                            if (err) {
                                                return next(err);
                                            }

                                            res.json('OK');
                                        });
                                    })
                                    .catch(err => next(err));
                            } else {
                                cont(user);
                            }
                        });
                    } else {
                        cont(user);
                    }

                    function cont (user) {
                        res.cookie('user', user._id, cookieOptions);
                        res.cookie('name', user.fullname, cookieOptions);
                        res.cookie('isClient', false, cookieOptions);

                        res.json(user);
                    }
                });
            });
        });
    }

    function logout (req, res) {
        res.clearCookie('user');
        res.clearCookie('name');
        res.clearCookie('isClient');
        res.json('OK');
    }

    function postRequestPasswordReset (req, res, next) {
        const token = uuid.v4();

        User.findOneAndUpdate({
            email: req.body.email,
            active: true
        }, {
            passwordResetToken: token
        }, (err, user) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return setTimeout(function () {
                    next(new Error('User with this email was not found.'));
                }, 1000);
            }

            mailer.sendResetPassword(req.get('host'), req.body.email, token, err => {
                if (err) {
                    return next(err);
                }

                res.json(token);
            });
        });
    }

    function postResetPassword (req, res, next) {
        User.findOne({
            passwordResetToken: req.body.token,
            active: true
        }, (err, user) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return next(new Error('Internal error.'));
            }

            delete user.passwordResetToken;

            bcrypt.genSalt((err, salt) => {
                if (err) {
                    return next(err);
                }

                bcrypt.hash(req.body.newPassword, salt, function(err, hash) {
                    if (err) {
                        return next(err);
                    }

                    user.passwordHash = hash;

                    user.save()
                        .then(() => {
                            res.json('OK');
                        })
                        .catch(next);
                });
            });
        });
    }

    function getUsers (req, res, next) {
        User.find(JSON.parse(decodeURIComponent(req.query.q)) || {}, {
            passwordHash: false
        }, (err, users) => {
            if (err) {
                return next(err);
            }

            res.json(users);
        });
    }

    function getUsersById (req, res, next) {
        User.findOne({_id: req.params.id}, {
            passwordHash: false
        }, (err, user) => {
            if (err) {
                return next(err);
            }

            res.json(user);
        });
    }

    function patchUsers (req, res, next) {
        User.findOne({
            _id: req.params.id
        }, (err, user) => {
            if (err) {
                return next(err);
            }

            user.patch(req.body, err => {
                if (err) {
                    return next(err);
                }

                res.json(user);
            });
        });
    }

    function deleteUsers (req, res, next) {
        User.findOne({
            _id: req.params.id
        }, (err, user) => {
            if (err) {
                return next(err);
            }

            user.remove(err => {
                if (err) {
                    return next(err);
                }

                res.json(user);
            });
        });
    }
};
