const mongoose = require('mongoose');

const Appointment = require('../db/appointment');
const User = require('../db/user');

const mailerService = require('../mailer');
const scheduleUtilsService = require('../schedule-utils');

module.exports = function (options) {
    const mailer = mailerService(options);
    const scheduleUtils = scheduleUtilsService(options);

    return {
        getAppointments: getAppointments,
        getAppointmentsById: getAppointmentsById,
        postAppointments: postAppointments,
        patchAppointments: patchAppointments,
        confirmAppointments: confirmAppointments,
        rejectAppointments: rejectAppointments,
        cancelAppointments: cancelAppointments,
        rateAppointments: rateAppointments
    };

    function getAppointments (req, res, next) {
        Appointment.find(JSON.parse(decodeURIComponent(req.query.q || '{}')) || {})
            .then(appointments => {
                res.json(appointments);
            })
            .catch(next);
    }

    function getAppointmentsById (req, res, next) {
        Appointment.findOne({
            _id: req.params.id
        }).then(appointment => {
            res.json(appointment);
        }).catch(next);
    }

    function postAppointments (req, res, next) {
        var host = req.get('host');
        var _id = mongoose.Types.ObjectId();

        (new Appointment(Object.assign({}, req.body, {
            _id: _id,
            rateLink: `https://${host}/rate-appointments?appointmentid=${_id}`,
            creationDate: Date.now()
        }))).save()
            .then(savedAppointment => {
                User.findOne({
                    email: savedAppointment.user
                }, (err, user) => {
                    if (err) {
                        return next(err);
                    }

                    mailer.sendAskConfirmation(host, savedAppointment, user, err => {
                        if (err) {
                            return next(err);
                        }

                        options.app.emit('appointments', {
                            serviceProviderId: savedAppointment.serviceProvider
                        });
                        res.json(savedAppointment);
                    });
                });
            })
            .catch(next);
    }

    function patchAppointments (req, res, next) {
        Appointment.findOne({
            _id: req.params.id
        }, (err, appointment) => {
            if (err) {
                return next(err);
            }

            appointment.patch(req.body, err => {
                if (err) {
                    return next(err);
                }

                res.json(appointment);
            });
        });
    }

    function confirmAppointments (req, res, next) {
        scheduleUtils.confirmAppointment(req.query.appointmentid, err => {
            if (err) {
                return next(err);
            }

            Appointment.findOne({
                _id: req.query.appointmentid
            }).then(appointment => {
                options.app.emit('appointments', {
                    serviceProviderId: appointment.serviceProvider
                });
                res.json('OK');
            }).catch(next);
        });
    }

    function rejectAppointments (req, res, next) {
        scheduleUtils.rejectAppointment(req.query.appointmentid, err => {
            if (err) {
                return next(err);
            }

            Appointment.findOne({
                _id: req.query.appointmentid
            }).then(appointment => {
                options.app.emit('appointments', {
                    serviceProviderId: appointment.serviceProvider
                });
                res.json('OK');
            }).catch(next);
        });
    }

    function cancelAppointments (req, res, next) {
        var host = req.get('host');
        scheduleUtils.cancelAppointment(req.query.appointmentid, host, err => {
            if (err) {
                return next(err);
            }

            Appointment.findOne({
                _id: req.query.appointmentid
            }).then(appointment => {
                options.app.emit('appointments', {
                    serviceProviderId: appointment.serviceProvider
                });
                res.json('OK');
            }).catch(next);
        });
    }

    function rateAppointments (req, res, _next) {
        return res.render('rate.pug', {
            pretty: true,
            appointmentId: req.query.appointmentid
        });
    }
};
