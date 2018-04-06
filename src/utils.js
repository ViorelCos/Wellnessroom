const moment = require('moment');

const ServiceProvider = require('./db/serviceprovider');
const Service = require('./db/service');
const User = require('./db/user');
const Client = require('./db/client');
const Appointment = require('./db/appointment');
const Slot = require('./db/slot');

module.exports = {
    withServiceProviderData: withServiceProviderData,
    withAppointmentData: withAppointmentData,
    withAppointmentsForClients: withAppointmentsForClients,
    withSlotsForClients: withSlotsForClients,
    asMinutes: asMinutes
};

function withServiceProviderData (serviceProviderId, cb) {
    ServiceProvider.findOne({_id: serviceProviderId}, (err, serviceProvider) => {
        if (err) {
            return cb(err);
        }

        Service.findOne({_id: serviceProvider.service}, (err, service) => {
            if (err) {
                return cb(err);
            }

            Client.findOne({serviceProviders: serviceProvider._id}, (err, client) => {
                if (err) {
                    return cb(err);
                }

                User.findOne({_id: client.userId}, (err, user) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, Object.assign({}, client.toObject(), serviceProvider.toObject(), {
                        serviceName: service.name,
                        clinicName: user.fullname,
                        email: user.email,
                        timezoneOffset: user.timezoneOffset
                    }));
                });
            });
        });
    });
}

function withAppointmentData (appointmentId, cb) {
    Appointment.findOne({_id: appointmentId}, (err, appointment) => {
        if (err) {
            return cb(err);
        }

        withServiceProviderData(appointment.serviceProvider, (err, data) => {
            if (err) {
                return cb(err);
            }

            cb(null, Object.assign(data, appointment.toObject()));
        });
    });
}

function withAppointmentsForClients (clients, cb) {
    var serviceProvidersMap = createServiceProviderMap(clients);
    var serviceProviderIds = Object.keys(serviceProvidersMap);

    Appointment.find({
        serviceProvider: {
            $in: serviceProviderIds
        }
    }, (err, appointments) => {
        if (err) {
            return cb(err);
        }

        var result = appointments.reduce((acc, app) => {
            var clientId = serviceProvidersMap[app.serviceProvider];
            if (!acc[clientId]) {
                acc[clientId] = [];
            }

            acc[clientId].push(app);
            return acc;
        }, {});

        cb(null, result);
    });
}

function withSlotsForClients (clients, cb) {
    var serviceProvidersMap = createServiceProviderMap(clients);
    var serviceProviderIds = Object.keys(serviceProvidersMap);

    Slot.find({
        serviceProvider: {
            $in: serviceProviderIds
        }
    }, (err, slots) => {
        if (err) {
            return cb(err);
        }

        var result = slots.reduce((acc, sl) => {
            var clientId = serviceProvidersMap[sl.serviceProvider];
            if (!acc[clientId]) {
                acc[clientId] = [];
            }

            acc[clientId].push(sl);
            return acc;
        }, {});

        cb(null, result);
    });
}

function createServiceProviderMap (clients) {
    return clients.reduce((acc, client) => {
        client.serviceProviders.reduce((innerAcc, serviceProviderId) => {
            innerAcc[serviceProviderId] = client._id;
            return innerAcc;
        }, acc);
        return acc;
    }, {});
}

function asMinutes (duration) {
    return moment.duration(duration).asMinutes() + ' minutes';
}
