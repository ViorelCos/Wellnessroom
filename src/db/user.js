const mongoose = require('mongoose');
const patcher = require('mongoose-json-patch');
const async = require('async');

const utils = require('./db-utils');

const userSchema = new mongoose.Schema({
    fullname: String,
    email: {type: String, unique: true},
    passwordHash: String,
    image: String,
    about: String,
    phone: String,
    website: String,
    facebook: String,
    instagram: String,
    pricePlanUrl: String,
    dob: Date,
    pricePlans: [{
        name: String,
        price: Number,
        description: String
    }],
    hoursOfOperation: String,
    address: String,
    newUsersCanBook: Boolean,
    timezoneOffset: String,
    active: Boolean,
    passwordResetToken: String,
    socialId: String
});

userSchema.plugin(patcher);

userSchema.pre('remove', function (next) {
    async.waterfall([
        cb => utils.removeByProp(this.model('Client'), 'userId', [this._id], err => cb(err)),
        cb => utils.removeByProp(this.model('Appointment'), 'user', [this.email], err => cb(err))
    ], next);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
