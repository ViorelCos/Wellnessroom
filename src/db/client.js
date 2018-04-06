const mongoose = require('mongoose');
const patcher = require('mongoose-json-patch');
const async = require('async');

const utils = require('./db-utils');

const clientSchema = new mongoose.Schema({
    userId: mongoose.Schema.ObjectId,
    services: [mongoose.Schema.ObjectId],
    serviceProviders: [mongoose.Schema.ObjectId],
    coords: {
        type: [Number],
        index: '2dsphere'
    },
    address: String
});

clientSchema.plugin(patcher);

clientSchema.pre('remove', function (next) {
    async.waterfall([
        cb => utils.removeByProp(this.model('ServiceProvider'), '_id', this.serviceProviders, err => cb(err))
    ], next);
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
