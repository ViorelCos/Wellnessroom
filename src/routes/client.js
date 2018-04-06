const Client = require('../db/client');

module.exports = function () {
    return {
        getClients: getClients,
        getClientsById: getClientsById,
        patchClients: patchClients
    };

    function getClients (req, res, next) {
        Client.find(JSON.parse(decodeURIComponent(req.query.q || '{}')) || {}, (err, clients) => {
            if (err) {
                return next(err);
            }

            res.json(clients);
        });
    }

    function getClientsById (req, res, next) {
        Client.findOne({_id: req.params.id}, (err, client) => {
            if (err) {
                return next(err);
            }

            res.json(client);
        });
    }

    function patchClients (req, res, next) {
        Client.findOne({
            _id: req.params.id
        }, (err, client) => {
            if (err) {
                return next(err);
            }

            client.patch(req.body, err => {
                if (err) {
                    return next(err);
                }

                res.json(client);
            });
        });
    }
};
