const Service = require('../db/service');

module.exports = function () {
    return {
        getServices: getServices
    };

    function getServices (req, res, next) {
        Service.find((err, services) => {
            if (err) {
                return next(err);
            }
            res.json(
                services.sort(function(a, b)
                    {
                        var nA = a.name.toLowerCase();
                        var nB = b.name.toLowerCase();
                
                        if(nA < nB)
                            return -1;
                        else if(nA > nB)
                            return 1;
                        return 0;
                    })
            );
        });
    }
};
