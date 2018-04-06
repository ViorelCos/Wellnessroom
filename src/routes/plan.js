const Plan = require('../db/plan');

module.exports = function () {
    return {
        getPlans: getPlans,
        getPlanById: getPlanById
    };

    function getPlans (req, res, next) {
        Plan.find((err, plans) => {
            if (err) {
                return next(err);
            }

            res.json(plans);
        });
    }

    function getPlanById (req, res, next) {
        Plan.findOne({
            _id: req.params.id
        }, (err, plan) => {
            if (err) {
                return next(err);
            }

            res.json(plan);
        });
    }
};
