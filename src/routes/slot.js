const Slot = require('../db/slot');

module.exports = function (options) {
    return {
        getSlots: getSlots,
        postSlots: postSlots,
        patchSlots: patchSlots,
        deleteSlots: deleteSlots
    };

    function getSlots (req, res, next) {
        Slot.find(JSON.parse(decodeURIComponent(req.query.q || '')) || {}, (err, slots) => {
            if (err) {
                return next(err);
            }

            res.json(slots);
        });
    }

    function postSlots (req, res, next) {
        (new Slot(Object.assign({}, req.body, {
            creationDate: Date.now()
        }))).save((err, savedSlot) => {
            if (err) {
                return next(err);
            }

            options.app.emit('slots', {
                serviceProviderId: savedSlot.serviceProvider
            });
            res.json(savedSlot);
        });
    }

    function patchSlots (req, res, next) {
        Slot.findOne({
            _id: req.params.id
        }, (err, slot) => {
            if (err) {
                return next(err);
            }

            slot.patch(req.body, err => {
                if (err) {
                    return next(err);
                }

                options.app.emit('slots', {
                    serviceProviderId: slot.serviceProvider
                });
                res.json(slot);
            });
        });
    }

    function deleteSlots (req, res, next) {
        Slot.findOne({
            _id: req.params.id
        }, (err, slot) => {
            if (err) {
                return next(err);
            }

            slot.remove(function (err) {
                if (err) {
                    return next(err);
                }

                options.app.emit('slots', {
                    serviceProviderId: slot.serviceProvider
                });
                res.json('OK');
            });
        });
    }
};
