const path = require('path');

const mongoose = require('mongoose');
const async = require('async');

const Appointment = require('../src/db/appointment');
const User = require('../src/db/user');

mongoose.connect(process.env.MONGODB_URI);

const options = require(path.join(__dirname, '..', 'conf', process.env.NODE_ENV + '.json'));
const mailer = require('../src/mailer')(options);

Appointment.find({
    acknowledged: true,
    confirmed: true,
    canceled: {
        $ne: true
    },
    slot: {
        $lte: Date.now() - options.RECENCY_OF_APPOINTMENT_FOR_SENDING_RATE_MAIL
    },
    ratingEmailSent: {
        $ne: true
    },
    rateLink: {
        $exists: true
    },
    rating: {
        $exists: false
    }
}, (err, appointments) => {
    if (err) {
        return console.error(err);
    }

    async.forEach(appointments, (appointment, cb) => {
        async.waterfall([
            function (innerCb) {
                User.findOne({
                    email: appointment.user
                }, (err, user) => {
                    if (err) {
                        return innerCb(err);
                    }

                    mailer.sendPleaseRateEmail(appointment, user, err => {
                        if (err) {
                            console.error(err);
                        }

                        innerCb();
                    });
                });
            },
            function (innerCb) {
                Appointment.update({
                    _id: appointment._id
                }, {
                    $set: {
                        ratingEmailSent: true
                    }
                }, err => {
                    if (err) {
                        console.error(err);
                    }

                    innerCb();
                });
            }
        ], cb);
    }, function () {
        mongoose.disconnect(err => {
            if (err) {
                console.error(err);
            }
            console.log('Done');
        });
    });
});
