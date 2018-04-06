const mongoose = require('mongoose');
const patcher = require('mongoose-json-patch');
const async = require('async');

const utils = require('./db-utils');

const serviceProviderSchema = new mongoose.Schema({
    name: String,
    service: mongoose.Schema.ObjectId,
    about: String,
    image: String
});

serviceProviderSchema.plugin(patcher);

serviceProviderSchema.pre('remove', function (next) {
    async.waterfall([
        cb => utils.removeByProp(this.model('Slot'), 'serviceProvider', [this._id], err => cb(err)),
        cb => utils.removeByProp(this.model('Appointment'), 'serviceProvider', [this._id], err => cb(err))
    ], next);
});

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);

module.exports = ServiceProvider;
