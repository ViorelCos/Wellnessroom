const mongoose = require('mongoose');

const Plan = mongoose.model('Plan', {
    name: String,
    description: String,
    priceCanadianCents: Number,
    serviceProviders: Number,
    postings: Number,
    premium: Boolean,
    stripeId: String
});

module.exports = Plan;
