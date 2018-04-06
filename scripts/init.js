const async = require('async');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Service = require('../src/db/service');
const Plan = require('../src/db/plan');

const plans = require('./plans.json');
const services = require('./services.json');

mongoose.connect(process.env.MONGODB_URI);

async.waterfall([
    function (cb) {
        async.forEach(services, (service, innerCb) => {
            (new Service({
                name: service
            })).save(err => {
                if (err) {
                    return innerCb(err);
                }

                innerCb();
            });
        }, cb);
    },
    function (cb) {
        stripe.products.create({
            name:  'WellnessRoom',
            type: 'service',
        }, function(err, product) {
            if (err) {
                return cb(err);
            }

            async.forEach(plans, (plan, innerCb) => {
                stripe.plans.create({
                    product: product.id,
                    currency: 'cad',
                    interval: 'month',
                    nickname: plan.name + ' ' + plan.description,
                    amount: plan.priceCanadianCents,
                }, function (err, stripePlan) {
                    if (err) {
                        return innerCb(err);
                    }

                    (new Plan(Object.assign({
                        stripeId: stripePlan.id
                    }, plan))).save(err => {
                        if (err) {
                            return innerCb(err);
                        }

                        innerCb();
                    });
                });
            }, cb);
        });
    }
], function (err) {
    if (err) {
        return console.error(err);
    }

    mongoose.disconnect();
    console.log('Done');
});
