const Appointment = require('./db/appointment');
const User = require('./db/user');
const mailerService = require('./mailer');

module.exports = function (options) {
    const mailer = mailerService(options);

    return {
        confirmAppointment: confirmAppointment,
        rejectAppointment: rejectAppointment,
        cancelAppointment: cancelAppointment
    };

    function confirmAppointment (appointmentId, cb) {
        updateAppointmentState(appointmentId, {confirmed: true, rejected: false}, err => {
            if (err) {
                return cb(err);
            }

            withUser(appointmentId, (err, user) => {
                mailer.sendConfirmBooking(appointmentId, user, cb);
            });
        });
    }

    function rejectAppointment (appointmentId, cb) {
        updateAppointmentState(appointmentId, {confirmed: false, rejected: true}, err => {
            if (err) {
                return cb(err);
            }

            withUser(appointmentId, (err, user) => {
                mailer.sendRejectBooking(appointmentId, user, cb);
            });
        });
    }

    function cancelAppointment (appointmentId, host, cb) {
        updateAppointmentState(appointmentId, {canceled: true}, err => {
            if (err) {
                return cb(err);
            }

            withUser(appointmentId, (err, user) => {
                mailer.sendCancelBooking(appointmentId, host, user, cb);
            });
        });
    }

    function updateAppointmentState (appointmentId, data, cb) {
        var query = {
            _id: appointmentId
        };

        if (!data.canceled) {
            query.acknowledged = {$ne: true};
        }

        Appointment.update(query, Object.assign(data, {
            acknowledged: true
        }), (err, res) => {
            if (err) {
                return cb(err);
            }

            if (res.nModified === 0) {
                return cb(new Error('Booking already confirmed/rejected'));
            }

            cb();
        });
    }

    function withUser (appointmentId, cb) {
        Appointment.findOne({
            _id: appointmentId
        }, (err, appointment) => {
            if (err) {
                return cb(err);
            }

            User.findOne({
                email: appointment.user
            }, cb);
        });
    }
};
