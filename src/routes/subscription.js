const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const User = require('../db/user');
const Order = require('../db/order');
const Client = require('../db/client');
const common = require('../common');

const cookieOptions = common.cookieOptions;

module.exports = function () {
    return {
        postSubscribe: postSubscribe,
        postUnsubscribe: postUnsubscribe
    };

    function postSubscribe (req, res, next) {
        if (!req.body.userId || !req.body.plan) {
            return next(new Error('Missing billing information, please inform site admin about this error. Your card won\'t be charged.'));
        }

        User.findOne({
            _id: req.body.userId
        }, (err, user) => {
            if (err) {
                return next(err);
            }

            stripe.customers.list({
                email: user.email
            }, (err, users) => {
                if (err) {
                    return next(err);
                }

                if (users.data.length) {
                    Order.find({
                        userId: req.body.userId
                    }).sort({
                        date: -1
                    }).limit(1).exec((err, orders) => {
                        if (err) {
                            return next(err);
                        }

                        const order = orders[0];

                        const subscriptionItemObject = {
                            plan: req.body.plan.stripeId
                        };

                        stripe.subscriptionItems.update(order.subscriptionItemId, subscriptionItemObject, (err, subscriptionItem) => {
                            if (err) {
                                return next(err);
                            }

                            (new Order({
                                subscriptionId: order.subscriptionId,
                                subscriptionItemId: subscriptionItem.id,
                                customerId: order.customerId,
                                userId: order.userId,
                                planId: req.body.plan._id,
                                date: Date.now(),
                                trial: false
                            })).save(err => {
                                if (err) {
                                    return next(err);
                                }

                                res.json('OK');
                            });
                        });
                    });
                } else {
                    if (!req.body.token) {
                        return next(new Error('Stripe token not generated or invalid, please inform site admin about this error. Your card won\'t be charged.'));
                    }

                    stripe.customers.create({
                        description:  user.fullname,
                        email: user.email
                    }, (err, customer) => {
                        if (err) {
                            return next(err);
                        }

                        const subscriptionObject = {
                            customer: customer.id,
                            items: [{
                                plan: req.body.plan.stripeId,
                            }],
                            source: req.body.token.id
                        };

//                        subscriptionObject.billing_cycle_anchor = moment().endOf('month').unix() + 1;

                        if (req.body.trial) {
//                        subscriptionObject.billing_cycle_anchor = moment().add(1, 'month').endOf('month').unix() + 1;
                            subscriptionObject.trial_period_days = moment().daysInMonth();
                        }

                        stripe.subscriptions.create(subscriptionObject, (err, subscription) => {
                            if (err) {
                                return next(err);
                            }

                            (new Order({
                                subscriptionId: subscription.id,
                                subscriptionItemId: subscription.items.data[0].id,
                                customerId: customer.id,
                                userId: req.body.userId,
                                planId: req.body.plan._id,
                                date: Date.now(),
                                trial: req.body.trial
                            })).save(err => {
                                if (err) {
                                    return next(err);
                                }

                                user.active = true;
                                user.save(err => {
                                    if (err) {
                                        return next(err);
                                    }

                                    Client.count({
                                        userId: user._id
                                    }, (err, count) => {
                                        res.cookie('user', user._id, cookieOptions);
                                        res.cookie('name', user.fullname, cookieOptions);
                                        res.cookie('isClient', count > 0, cookieOptions);

                                        res.json('OK');
                                    });
                                });
                            });
                        });
                    });
                }
            });
        });
    }

    function postUnsubscribe (req, res, next) {
        User.findOne({
            _id: req.body.userId
        }, (err, user) => {
            if (err) {
                return next(err);
            }

            Order.find({
                userId: req.body.userId
            }).sort({
                date: -1
            }).limit(1).exec((err, orders) => {
                stripe.subscriptions.del(orders[0].subscriptionId, err => {
                    if (err) {
                        return next(err);
                    }

                    user.active = false;
                    user.save(err => {
                        if (err) {
                            return next(err);
                        }

                        res.clearCookie('user');
                        res.clearCookie('name');
                        res.clearCookie('isClient');

                        res.json('OK');
                    });
                });
            });
        });
    }
};
