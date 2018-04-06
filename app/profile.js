angular.module('wellnessroom')
.controller('ProfileCtrl', ['$geoLocate', '$rootScope', '$scope', '$http', 'TORONTO_COORDS', 'Services', 'utils', 'Alerter', 'handler', function ($geoLocate, $rootScope, $scope, $http, TORONTO_COORDS, Services, utils, Alerter, handler) {
    $rootScope.backgroundImage = 'white';
    var ooPatch = window.JSON8Patch;
    var oo = window.JSON8;
    var alerter = new Alerter();

    $scope.userId = window.USER_ID;
    $scope.isClient = window.IS_CLIENT;

    if ($scope.isClient) {
        $scope.timezones = [{
            label: 'Atlantic Standard Time',
            value: 'America/Halifax'
        }, {
            label: 'Eastern Standard Time',
            value: 'America/Toronto'
        }, {
            label: 'Central Standard Time',
            value: 'America/Atikokan'
        }, {
            label: 'Mountain Standard Time',
            value: 'America/Edmonton'
        }, {
            label: 'Pacific Standard Time',
            value: 'America/Vancouver'
        }];

        $http.get('/clients?q=' + encodeURIComponent(JSON.stringify({
            userId: $scope.userId
        }))).then(function (result) {
            $http.get('/users/' + result.data[0].userId)
                .then(function (userResult) {
                    var appointmentsQuery = encodeURIComponent(JSON.stringify({
                        serviceProvider: {
                            $in: result.data[0].serviceProviders
                        }
                    }));
                    $http.get('/appointments?q=' + appointmentsQuery)
                        .then(function (appointmentsResult) {
                            $scope.appointments = appointmentsResult.data;

                            var services = new Services(result.data[0].serviceProviders);
                            services.withServices(function (err, serviceResult) {
                                if (err) {
                                    return handler(err);
                                }

                                $scope.services = serviceResult.services;
                                $scope.servicesMap = serviceResult.servicesMap;
                                $scope.serviceProviders = serviceResult.serviceProviders;
                                $scope.serviceProvidersMap = serviceResult.serviceProvidersMap;
                                $scope.selectedService = serviceResult.services[0]._id;

                                initClient(result.data[0]);
                                initUser(userResult.data);

                                utils.initTypeAhead(afterSelect);
                            });
                        })
                        .catch(handler);
                })
                .catch(handler);
        }).catch(handler);
        $scope.$watch('client.services', function (services) {
            if (!services) {
                return;
            }
            $scope.providedServices = $scope.services.filter(function (service) {
                return ~$scope.client.services.indexOf(service._id);
            });
            if ($scope.providedServices[0]) {
                $scope.selectedProvidedService = $scope.providedServices[0]._id;
            }
        }, true);

        $scope.addService = function (serviceId) {
            if (!~$scope.client.services.indexOf(serviceId)) {
                $scope.client.services.push(serviceId);
                $scope.selectedService = $scope.services[0]._id;
                $scope.saveClient();
            }
        };

        $scope.removeService = function (serviceId) {
            console.log(Object.keys($scope.serviceProvidersMap).find(function (key) {
                return $scope.serviceProvidersMap[key].service === serviceId;
            }));
            if (Object.keys($scope.serviceProvidersMap).find(function (key) {
                return $scope.serviceProvidersMap[key].service === serviceId;
            })) {
                return alerter.warning('Cannot delete provided speciality while there are service providers in it.');
            }

            var idx = $scope.client.services.indexOf(serviceId);
            $scope.client.services.splice(idx, 1);
            $scope.saveClient();
        };

        $scope.addServiceProvider = function (name, serviceId) {
            if (!name) {
                return;
            }
            $http.post('/serviceproviders', {
                name: name,
                service: serviceId
            }).then(function (result) {
                var serviceProvider = result.data;
                $scope.client.serviceProviders.push(serviceProvider._id);
                $scope.serviceProvidersMap[serviceProvider._id] = serviceProvider;
                $scope.selectedProvidedService = $scope.providedServices[0]._id;
                $scope.serviceProviderName = null;
                $scope.saveClient();
            }).catch(handler);
        };

        $scope.removeServiceProvider = function (serviceProviderId) {
            alerter.confirm('You won\'t be able to undo this action.', function (result) {
                if (result.value) {
                    $http.delete('/serviceproviders/' + serviceProviderId)
                        .then(function () {
                            var idx = $scope.client.serviceProviders.indexOf(serviceProviderId);
                            delete $scope.serviceProvidersMap[serviceProviderId];
                            $scope.client.serviceProviders.splice(idx, 1);
                            $scope.saveClient();
                        })
                        .catch(handler);
                }
            });
        };

        $scope.updateCoords = function (/* data */) {
//            $scope.client.coords = [data.lat(), data.lng()];
//            $http.get('/reverse-geocode?latitude=' + data.lat() + '&longitude=' + data.lng())
//                .then(function (result) {
//                    $scope.client.address = result.data[0].formatted_address;
//                    $scope.saveClient();
//                })
//                .catch(handler);
        };
    } else {
        $http.get('/users/' + $scope.userId)
            .then(function (userResult) {
                console.log(userResult);
                userResult.data.dob = new Date(userResult.data.dob);
                var appointmentsQuery = encodeURIComponent(JSON.stringify({
                    user: userResult.data.email
                }));

                $http.get('/appointments?q=' + appointmentsQuery)
                    .then(function (appointmentsResult) {
                        $scope.appointments = appointmentsResult.data;
                        initUser(userResult.data);
                    })
                    .catch(handler);
            })
            .catch(handler);
    }

    $scope.saveUser = function () {
        console.log("jahafsfdsf");
        var diff = ooPatch.diff($scope.savedUser, $scope.user);
        $http.patch('/users/' + $scope.user._id, diff)
            .then(function (result) {
                initUser(result.data);
                if($scope.isClient){
                    $scope.saveClient();
                }
            })
            .catch(handler);
    };

    $scope.saveClient = function () {
        var diff = ooPatch.diff($scope.savedClient, $scope.client);

        $http.patch('/clients/' + $scope.client._id, diff)
            .then(function (result) {
                initClient(result.data);
            })
            .catch(handler);
    };

    $scope.addPricePlan = function (newName, newPrice, newDescription) {
        if (!newName || !newPrice || !newDescription) {
            return;
        }

        $scope.user.pricePlans.push({
            name: newName,
            price: newPrice,
            description: newDescription
        });

        $scope.saveUser();
    };

    $scope.deletePricePlan = function (index) {
        $scope.user.pricePlans.splice(index, 1);
        $scope.saveUser();
    };

    function initClient (client) {
        $scope.client = client;
        $scope.savedClient = oo.clone($scope.client);
        $scope.client.coords = $scope.client.coords || TORONTO_COORDS; // Default is Toronto
    }

    function initUser (user) {
        $scope.user = user;
        $scope.savedUser = oo.clone($scope.user);
        if(!$scope.user.address) {
            getGeoLocationForUser();
        }
    }

    function afterSelect (item) {
        $http.post('/place-query', {
            placeid: item.placeId,
            address: item.description
        }).then(function (result) {
            if ($scope.client && $scope.client.coords) {
                $scope.client.coords[0] = result.data.lat;
                $scope.client.coords[1] = result.data.lng;
            }
            $scope.user.address = item.description;
        }).catch(handler);
    }

    function getGeoLocationForUser() {
            $geoLocate().then(function (position) {
                console.log(position)
                $scope.coords = position.coords;
                reverseGeoCode();
            }, function (err) { // Probably geo location is off
                console.log(err);
                $scope.coords = {
                    latitude: TORONTO_COORDS[0],
                    longitude: TORONTO_COORDS[1]
                };
                reverseGeoCode();
            });

        function reverseGeoCode () {
            $http.get('/reverse-geocode?longitude=' + $scope.coords.longitude + '&latitude=' + $scope.coords.latitude)
                .then(function (result) {
                    $scope.user.address = extractAddress(result.data);
                    console.log($scope.location)
                    utils.initTypeAhead(afterSelect);
                });
        }
        function extractAddress (results) {
            return results[0].formatted_address;
        }
    }
}]);
