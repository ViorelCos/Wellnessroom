angular.module('wellnessroom')
.service('Services', ['$http', function ($http) {
    var Services = function (serviceProviders) {
        this.serviceProvidersQuery = encodeURIComponent(JSON.stringify(serviceProviders ? {
                _id: {
                    $in: serviceProviders
                }
            } : {}));
    };

    Services.prototype.withServices = function (callback) {
        var self = this;
        if (!self.services) {
            $http.get('/services')
                .then(function (result) {
                    self.services = result.data;
                    self.servicesMap = self.services.reduce(function (acc, service) {
                        acc[service._id] = service;
                        return acc;
                    }, {});

                    $http.get('/serviceproviders?q=' + self.serviceProvidersQuery)
                        .then(function (result) {
                            self.serviceProvidersMap = result.data.reduce(function (acc, serviceProvider) {
                                acc[serviceProvider._id] = serviceProvider;
                                return acc;
                            }, {});

                            self.returnResult(callback);
                        })
                        .catch(function (err) {
                            callback(err);
                        });
                })
                .catch(function (err) {
                    callback(err);
                });
        } else {
            this.returnResult(callback);
        }
    };


    Services.prototype.returnResult = function (callback) {
        return callback(null, {
            services: this.services,
            servicesMap: this.servicesMap,
            serviceProviders: this.serviceProviders,
            serviceProvidersMap: this.serviceProvidersMap
        });
    };

    return Services;
}]);
