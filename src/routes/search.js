const mongoose = require('mongoose');
const googleMaps = require('@google/maps');

const Client = require('../db/client');
const User = require('../db/user');
const utils = require('../utils');
const common = require('../common');

const maps = googleMaps.createClient({
    key: process.env.GOOGLE_API_KEY
});

const cookieOptions = common.cookieOptions;

module.exports = function () {
    return {
        search: search,
        reverseGeocode: reverseGeocode,
        mapAutocomplete: mapAutocomplete,
        placeQuery: placeQuery
    };

    function search (req, res, next) {
        User.find({
            active: {
                $ne: false
            }
        }, {
            _id: true
        }, function (err, users) {
            if (err) {
                return next(err);
            }

            var geoOptions = {
                near: {
                    type: 'Point',
                    coordinates: [
                        parseFloat(req.body.lat),
                        parseFloat(req.body.lng)
                    ]
                },
                maxDistance: 50 * 1609,
                spherical: true,
                distanceField: 'distance',
            };

            Client.collection.aggregate([{
                $geoNear: geoOptions
            }, {
                $match: {
                    services: mongoose.Types.ObjectId(req.body.serviceId),
                    userId: { // Show only active clients
                        $in: users.map(u => u._id)
                    }
                }
            }], function (err, cursor) {
                if (err) {
                    return next(err);
                }

                cursor.toArray().then(clients => {
                    utils.withAppointmentsForClients(clients, function (err, appointmentsMap) {
                        if (err) {
                            return next(err);
                        }

                        utils.withSlotsForClients(clients, (err, slotsMap) => {
                            if (err) {
                                return next(err);
                            }

                            res.json(clients.map(client => {
                                return Object.assign({}, client, {
                                    appointmentsMap: (appointmentsMap[client._id] || []).reduce((acc, app) => {
                                        if (!acc[app.serviceProvider]) {
                                            acc[app.serviceProvider] = [];
                                        }
                                        acc[app.serviceProvider].push(app);
                                        return acc;
                                    }, {}),
                                    slotsMap: (slotsMap[client._id] || []).reduce((acc, sl) => {
                                        if (!acc[sl.serviceProvider]) {
                                            acc[sl.serviceProvider] = [];
                                        }
                                        acc[sl.serviceProvider].push(sl);
                                        return acc;
                                    }, {})
                                });
                            }, []));
                        });
                    });
                }).catch(err => next(err));
            });
        });
    }

    function reverseGeocode (req, res, next) {
        maps.reverseGeocode({
            latlng: [req.query.latitude, req.query.longitude]
        }, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result.json.results);
        });
    }

    function mapAutocomplete (req, res, next) {
        maps.placesAutoComplete({
            input: decodeURIComponent(req.query.input)
        }, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result.json.predictions);
        });
    }

    function placeQuery (req, res, next) {
        maps.place({
            placeid: decodeURIComponent(req.body.placeid)
        }, function (err, result) {
            if (err) {
                return next(err);
            }

            res.cookie('user.address', req.body.address, cookieOptions);

            res.json(result.json.result.geometry.location);
        });
    }
};
