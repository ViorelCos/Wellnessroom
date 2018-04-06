angular.module('wellnessroom')
.controller('ClientCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    '$routeParams',
    'Services',
    'utils',
    'handler',
    function (
        $rootScope,
        $scope,
        $http,
        $routeParams,
        Services,
        utils,
        handler
    ) {
    $rootScope.backgroundImage = 'white';
    var services = new Services();

    $scope.selectedServiceProvider = {};
    $scope.utils = utils;

    services.withServices(function (err, result) {
        if (err) {
            return handler(err);
        }

        $scope.services = result.services;
        $scope.servicesMap = result.servicesMap;
        $scope.serviceProviders = result.serviceProviders;
        $scope.serviceProvidersMap = result.serviceProvidersMap;

        $http.get('/clients/' + $routeParams.id)
            .then(function (result) {
                $scope.client = result.data;

                utils.deleteMap($scope.selectedServiceProvider);
                Object.assign($scope.selectedServiceProvider, $scope.serviceProvidersMap[$routeParams.serviceproviderid]);
                $scope.otherServiceProviders = $scope.client.serviceProviders.filter(function (serviceProviderId) {
                    return serviceProviderId !== $scope.selectedServiceProvider._id;
                }).map(function (serviceProviderId) {
                    return $scope.serviceProvidersMap[serviceProviderId];
                });

                $scope.availableServices = utils.unique(($scope.client.serviceProviders || []).map(function (serviceProviderId) {
                    return $scope.servicesMap[$scope.serviceProvidersMap[serviceProviderId].service].name;
                }));

                $http.get('/users/' + $scope.client.userId)
                    .then(function (result) {
                        Object.assign($scope.client, result.data, {
                            _id: $scope.client._id
                        });

                        $scope.pricePlanTuples = [];
                        var current;
                        for (var i = 0; i < ($scope.client.pricePlans || []).length; i++) {
                            if (i % 3 === 0) {
                                current = [];
                                $scope.pricePlanTuples.push(current);
                            }
                            current.push($scope.client.pricePlans[i]);
                        }

                        var query = encodeURIComponent(JSON.stringify({
                            serviceProvider: {
                                $in: $scope.client.serviceProviders
                            }
                        }));
                        $http.get('/appointments?q=' + query)
                            .then(function (appointmentsResult) {
                                $scope.appointments = appointmentsResult.data;

                                $scope.rated = $scope.appointments.filter(function (appointment) {
                                    return appointment.rating >= 0;
                                });
                                $scope.reviewed = $scope.appointments.filter(function (appointment) {
                                    return appointment.review;
                                });
                                $scope.rating = Math.round(($scope.rated.reduce(function (acc, appointment) {
                                    return acc + appointment.rating;
                                }, 0) / $scope.rated.length) * 10) / 10;
                            })
                            .catch(handler);
                    })
                    .catch(handler);
            })
            .catch(handler);

        $scope.selectServiceProvider = function (serviceProviderId) {
            utils.deleteMap($scope.selectedServiceProvider);
            Object.assign($scope.selectedServiceProvider, $scope.serviceProvidersMap[serviceProviderId]);
            $scope.selectedService = $scope.servicesMap[$scope.serviceProvidersMap[serviceProviderId].service];
        };

        $scope.scrollToPricingPlan = function () {
            var el = document.getElementById('price-plan');
            el.scrollIntoView();
        };
    });

    $scope.$on('$locationChangeSuccess', function () {
        $rootScope.backgroundImage = 'url(\'/img/slider/slider-white1.jpg\')';
    });
}]);
