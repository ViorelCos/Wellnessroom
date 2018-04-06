const ServiceProvider = require('../db/serviceprovider');
const Client = require('../db/client');
const Order = require('../db/order');
const Plan = require('../db/plan');

module.exports = function () {
    return {
        getServiceProviders: getServiceProviders,
        getServiceProvidersById: getServiceProvidersById,
        postServiceProviders: postServiceProviders,
        patchServiceProviders: patchServiceProviders,
        deleteServiceProviders: deleteServiceProviders
    };

    function getServiceProviders (req, res, next) {
        ServiceProvider.find(JSON.parse(decodeURIComponent(req.query.q || '{}')) || {})
            .then(serviceProviders => {
                res.json(serviceProviders);
            })
            .catch(err => next(err));
    }

    function getServiceProvidersById (req, res, next) {
        ServiceProvider.findOne({_id: req.params.id})
            .then(serviceProvider => {
                res.json(serviceProvider);
            })
            .catch(err => next(err));
    }

    function postServiceProviders (req, res, next) {
        Client.findOne({
            userId: req.cookies.user
        }, (err, client) => {
            if (err) {
                return next(err);
            }

            Order.find({
                userId: req.cookies.user
            }).sort({date: -1}).limit(1).exec((err, orders) => {
                if (err) {
                    return next(err);
                }

                if (!orders.length) {
                    return next(new Error('You don\'t have a plan associated with your account, please contact an administrator.'));
                }

                Plan.findOne({
                    _id: orders[0].planId
                }, (err, plan) => {
                    if (err) {
                        return next(err);
                    }

                    if (plan.serviceProviders > (client.serviceProviders || []).length) {
                        (new ServiceProvider(req.body)).save()
                            .then(savedServiceProvider => {
                                res.json(savedServiceProvider);
                            })
                            .catch(err => next(err));
                    } else {
                        return next(new Error('Unfortunately your current plan doesn\'t allow adding more service providers.'));
                    }
                });
            });
        });
    }

    function patchServiceProviders (req, res, next) {
        ServiceProvider.findOne({
            _id: req.params.id
        }, (err, serviceProvider) => {
            if (err) {
                return next(err);
            }

            serviceProvider.patch(req.body, err => {
                if (err) {
                    return next(err);
                }

                res.json(serviceProvider);
            });
        });
    }

    function deleteServiceProviders (req, res, next) {
        ServiceProvider.remove({_id: req.params.id})
            .then(() => {
                res.json('OK');
            })
            .catch(err => next(err));
    }
};
