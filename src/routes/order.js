const Order = require('../db/order');

module.exports = function () {
    return {
        getOrders: getOrders
    };

    function getOrders (req, res, next) {
        Order.find(JSON.parse(decodeURIComponent(req.query.q || '')) || {}, (err, orders) => {
            if (err) {
                return next(err);
            }

            res.json(orders);
        });
    }
};
