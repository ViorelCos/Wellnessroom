angular.module('wellnessroom')
.directive('search', ['$rootScope', '$http', '$location', 'TORONTO_COORDS', '$geoLocate', 'utils', 'Alerter', 'handler', function ($rootScope, $http, $location, TORONTO_COORDS, $geoLocate, utils, Alerter, handler) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
        },
        link: function ($scope) {
            $rootScope.backgroundImage = 'url(\'/img/slider/slider-white1.jpg\')';

            $geoLocate().then(function (position) {
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
                        $scope.location = extractAddress(result.data);
                        utils.initTypeAhead(afterSelect);
                    });
            }

            function extractAddress (results) {
                return results[0].formatted_address;
            }

            function afterSelect (item) {
                $scope.placeId = item.placeId;
                $scope.address = item.description;
            }

            $http.get('/services')
                .then(function (result) {
                    $scope.services = result.data;
                    $scope.selectedService = result.data[0]._id;
                })
                .catch(handler);

            $scope.search = function (serviceId) {
                if ($scope.placeId) {
                    $http.post('/place-query', {
                        placeid: $scope.placeId,
                        address: $scope.address
                    }).then(function (result) {
                        navigateToMap(serviceId, result.data.lat, result.data.lng);
                    }).catch(handler);
                } else {
                    navigateToMap(serviceId, $scope.coords.latitude, $scope.coords.longitude);
                }
            };

            function navigateToMap (serviceId, lat, lng) {
                var url = ['/search-map', serviceId, lat, lng].join('/');
                $location.url(url);
            }
        },
        templateUrl: '/views/search.html'
    };
}]);
