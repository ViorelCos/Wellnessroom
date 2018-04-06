const path = require('path');

const EmailTemplates = require('swig-email-templates');
const moment = require('moment');
const momentTz = require('moment-timezone');
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

const utils = require('./utils');

module.exports = function (options) {
    var auth = {
        auth: {
            api_key: process.env.MAILGUN_API_KEY,
            domain: 'wellnessroom.ca'
        }
    };

    var nodemailerMailgun = nodemailer.createTransport(mg(auth));

    const templates = new EmailTemplates({
        root: path.join(__dirname, '..', 'email-templates'),
        swig: {
            cache: false
        },
        juice: {
            inlinePseudoElements: true,
            ignoredPseudos: []
        }
    });

    return {
        sendAskConfirmation: sendAskConfirmation,
        sendConfirmBooking: sendConfirmBooking,
        sendRejectBooking: sendRejectBooking,
        sendCancelBooking: sendCancelBooking,
        sendPleaseRateEmail: sendPleaseRateEmail,
        sendActivationLink: sendActivationLink,
        sendResetPassword: sendResetPassword
    };

    function send (msg, cb) {
        nodemailerMailgun.sendMail(msg, err => {
            if (err) {
                return cb(err);
            }

            cb();
        });
    }

    function sendAskConfirmation (host, appointment, user, cb) {
        utils.withServiceProviderData(appointment.serviceProvider, (err, serviceProviderData) => {
            if (err) {
                return cb(err);
            }

            const confirmUrl = `https://${host}/confirm-appointments?appointmentid=${appointment._id}`;
            const rejectUrl = `https://${host}/reject-appointments?appointmentid=${appointment._id}`;
            const timeHuman = momentTz(appointment.slot).tz(serviceProviderData.timezoneOffset || 'UTC').format('dddd, MMMM D, YYYY, h:mm A');
            const date = user.dob;
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const month = monthNames[date.getMonth()];
            const day = date.getDate();
            const year = date.getFullYear();
            const dob = month + " " + day + ", " + year;

            const isHomeMassage = (serviceProviderData.serviceName === 'Registered Massage Therapy (In Home Service)') || (serviceProviderData.serviceName === 'Chiropractor (In Home Service)') || (serviceProviderData.serviceName === 'Physiotherapy (In Home Service)');

            templates.render('ask-confirmation.html', {
                userFullName: user.fullname,
                serviceName: serviceProviderData.serviceName,
                serviceProviderName: serviceProviderData.name,
                isHomeMassage: isHomeMassage,
                timeHuman: timeHuman,
                duration: ~appointment.duration ? ' - ' + utils.asMinutes(appointment.duration) : '',
                address: user.address,
                phone: appointment.phone,
                dob: dob,
                notes: appointment.notes,
                confirmUrl: confirmUrl,
                rejectUrl: rejectUrl,
                logoUrl: options.LOGO_URL
            }, (err, html, text) => {
                if (err) {
                    return cb(err);
                }
                const msg = {
                    to: serviceProviderData.email,
                    from: options.SENDER_EMAIL,
                    subject: 'Appointment requested for ' + serviceProviderData.name,
                    html: html,
                    text: text
                };

                send(msg, cb);
            });
        });
    }

    function sendConfirmBooking (appointmentId, user, cb) {
        utils.withAppointmentData(appointmentId, (err, data) => {
            if (err) {
                return cb(err);
            }

            const timeHuman = moment(data.slot).utcOffset(data.offset || 0).format('dddd, MMMM D, YYYY, h:mm A');
            const hour = moment(data.slot).utcOffset(data.offset || 0).format('h:mm A');
            const endHour = ~data.duration && moment(data.slot + data.duration).utcOffset(data.offset || 0).format('h:mm A');
            var coords = [data.coords[0], data.coords[1]].join('+');

            templates.render('confirm.html', {
                userName: (user.fullname || '').split(' ')[0],
                clinicName: data.clinicName,
                serviceProviderName: data.name,
                serviceName: data.serviceName,
                address: data.address,
                isNotHomeMassage: !data.isHomeMassage,
                mapUrl: ['http://maps.google.com/maps?&z=16&q=', coords, '&ll=', coords].join(''),
                timeHuman: timeHuman,
                duration: ~data.duration ? ' - ' + utils.asMinutes(data.duration) : '',
                hourDuration: hour + (endHour ? ' - ' + endHour : ''),
                logoUrl: options.LOGO_URL
            }, (err, html, text) => {
                if (err) {
                    return cb(err);
                }

                const msg = {
                    to: data.user,
                    from: options.SENDER_EMAIL,
                    subject: 'Your appointment has been confirmed',
                    html: html,
                    text: text
                };

                send(msg, cb);
            });
        });
    }

    function sendRejectBooking (appointmentId, user, cb) {
        utils.withAppointmentData(appointmentId, (err, data) => {
            if (err) {
                return cb(err);
            }

            templates.render('reject.html', {
                userName: (user.fullname || '').split(' ')[0],
                serviceProviderName: data.name,
                logoUrl: options.LOGO_URL
            }, (err, html, text) => {
                if (err) {
                    return cb(err);
                }

                const msg = {
                    to: data.user,
                    from: options.SENDER_EMAIL,
                    subject: 'Your appointment has been declined',
                    html: html,
                    text: text
                };

                send(msg, cb);
            });
        });
    }

    function sendCancelBooking (appointmentId, host, user, cb) {
        utils.withAppointmentData(appointmentId, (err, appointment) => {
            utils.withServiceProviderData(appointment.serviceProvider, (err, serviceProviderData) => {
                if (err) {
                    return cb(err);
                }

                const timeHuman = momentTz(appointment.slot).tz(serviceProviderData.timezoneOffset || 'UTC').format('dddd, MMMM D, YYYY, h:mm A');

                templates.render('cancel.html', {
                    userFullName: user.fullname,
                    serviceName: serviceProviderData.serviceName,
                    serviceProviderName: serviceProviderData.name,
                    timeHuman: timeHuman,
                    duration: ~appointment.duration ? ' - ' + utils.asMinutes(appointment.duration) : '',
                    address: appointment.address,
                    phone: appointment.phone,
                    notes: appointment.notes,
                    logoUrl: options.LOGO_URL
                }, (err, html, text) => {
                    if (err) {
                        return cb(err);
                    }

                    const msg = {
                        to: serviceProviderData.email,
                        from: options.SENDER_EMAIL,
                        subject: 'Appointment cancelation for ' + serviceProviderData.name,
                        html: html,
                        text: text
                    };

                    send(msg, cb);
                });
            });
        });
    }

    function sendPleaseRateEmail (appointment, user, cb) {
        utils.withServiceProviderData(appointment.serviceProvider, (err, data) => {
            if (err) {
                return cb(err);
            }

            templates.render('please-rate.html', {
                userName: (user.fullname || '').split(' ')[0],
                clinicName: data.clinicName,
                serviceProviderName: data.name,
                rateLink: appointment.rateLink,
                logoUrl: options.LOGO_URL
            }, (err, html, text) => {
                if (err) {
                    return cb(err);
                }

                const msg = {
                    to: appointment.user,
                    from: options.SENDER_EMAIL,
                    subject: 'Review your service experience',
                    html: html,
                    text: text
                };

                send(msg, cb);
            });
        });
    }

    function sendActivationLink (host, userEmail, userId, planId, cb) {
        const activationUrl = `https://${host}/activate/${userId}` + (planId ? '/' + planId : '');

        templates.render('activate.html', {
            activationUrl: activationUrl,
            logoUrl: options.LOGO_URL
        }, (err, html, text) => {
            if (err) {
                return cb(err);
            }

            const msg = {
                to: userEmail,
                from: options.SENDER_EMAIL,
                subject: 'Please activate your WellnessRoom account',
                html: html,
                text: text,
            };

            send(msg, cb);
        });
    }

    function sendResetPassword (host, userEmail, token, cb) {
        const resetUrl = `https://${host}/reset-password/${token}`;

        templates.render('reset-password.html', {
            resetUrl: resetUrl,
            logoUrl: options.LOGO_URL
        }, (err, html, text) => {
            if (err) {
                return cb(err);
            }

            const msg = {
                to: userEmail,
                from: options.SENDER_EMAIL,
                subject: 'You Have Requested To Reset Your Password',
                html: html,
                text: text,
            };

            send(msg, cb);
        });
    }
};
