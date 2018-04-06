const mongoose = require('mongoose');

const Order = mongoose.model('Order', {
    subscriptionId: String,
    subscriptionItemId: String,
    customerId: String,
    userId: mongoose.Schema.ObjectId,
    planId: mongoose.Schema.ObjectId,
    date: Number,
    trial: Boolean
});

module.exports = Order;
