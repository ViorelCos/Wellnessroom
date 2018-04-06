angular.module('wellnessroom')
.directive('appointment', [
    '$geoLocate',
    '$rootScope',
    '$http',
    '$location',
    '$timeout',
    'Alerter',
    'DURATIONS_CONSTANTS',
    'Slots',
    'Appointments',
    'utils',
    'handler',
    'schedulingUtils',
    'TORONTO_COORDS',
    function (
        $geoLocate,
        $rootScope,
        $http,
        $location,
        $timeout,
        Alerter,
        DURATIONS_CONSTANTS,
        Slots,
        Appointments,
        utils,
        handler,
        schedulingUtils,
        TORONTO_COORDS
    ) {
    var ooPatch = window.JSON8Patch;
    var oo = window.JSON8;
    var alerter = new Alerter();

    return {
        restrict: 'E',
        replace: true,
        scope: {
            service: '=',
            serviceProvider: '=',
            client: '=',
            newUsersCanBook: '='
        },
        link: function ($scope) {
            $scope.allSlots = [];
            $scope.slotsMap = {};
            $scope.allAppointments = [];
            $scope.durations = {};
            $scope.daySelected = new Date();
            $scope.userId = window.USER_ID;
            $scope.contacts = {
                returningUser: true
            };
            $scope.fields = {};

            $scope.sUtils = schedulingUtils($scope.allAppointments);

            $http.get('/config')
                .then(function (result) {
                    $scope.googleRecaptchaPublicKey = result.data.googleRecaptchaPublicKey;
                })
                .catch(handler);

            $scope.startBooking = function () {
                if (!$scope.durations[$scope.selected]) {
                    return;
                }

                $scope.durationMask = void 0;
                if ($scope.durations[$scope.selected] !== DURATIONS_CONSTANTS[0].mask) { // User gets to pick duration
                    window.angular.element('#durationModal').modal('show');
                    window.angular.element('#durationModal').on('hide.bs.modal', function () {
                        window.angular.element('#durationModal').off('hide.bs.modal');
                        if ($scope.durationMask) {
                            cont(utils.maskToDurations($scope.durationMask)[0]);
                        }
                    });
                } else { // No duration
                    cont(-1);
                }

                function cont (duration) {
                    var appointmentDate = utils.slotToDate($scope.daySelected, $scope.selected);
                    var date = new Date(appointmentDate);

                    $scope.duration = duration;
                    $scope.date = date;

                    if ($scope.userId) {
                        var query = encodeURIComponent(JSON.stringify({
                            userId: $scope.userId
                        }));
                        $http.get('/clients?q=' + query)
                            .then(function (result) {
                                if (result.data.length) { // Logged in as client
                                    $scope.getUserData();
                                } else {
                                    $http.get('/users/' + $scope.userId)
                                        .then(function (result) {
                                            // result.data.dob = new Date(result.data.dob);
                                            $scope.user = result.data;
                                            $scope.getUserData();
                                        })
                                        .catch(handler);
                                }
                            })
                            .catch(handler);
                    } else {
                        $scope.getUserData();
                    }
                }
            };

            // Login or register
            $scope.getUserData = function () {
                if ($scope.user) {
                    $scope.getContactData();
                } else {
                    window.angular.element('#appointmentUserModal').modal('show');
                }
            };

            // Gather contact info
            $scope.getContactData = function () {
                $scope.contacts.dob = new Date($scope.user.dob);
                $scope.contacts.phone = $scope.user.phone;
                window.angular.element('#appointmentUserModal').modal('hide');
                window.angular.element('#appointmentContactModal').modal('show');
                getGeoLocationForUser();
            };

            $scope.book = function () {
                $scope.errorMessage = '';
                // if(!$scope.contacts.dob) {
                //     $scope.errorMessage = 'Please fill all fields.';
                //     return;
                // }
                if (!$scope.contacts.dob || !$scope.contacts.phone || !$scope.contacts.address && $scope.isHomeMassage || $scope.contacts.phone != $scope.user.phone || $scope.contacts.dob != $scope.user.dob || $scope.contacts.address != $scope.user.address) {
                    saveUserData(cont); 
                } else {
                    cont();
                }

                function cont () {
                    if (!$scope.contacts.returningUser) {
                        return alerter.warning($scope.client.fullname + ' does not allow new patients to book online. Please call ' + $scope.client.phone + ' to book appointment.', function () {
                            clear();
                        });
                    }

                    $http.post('/appointments', {
                        serviceProvider: $scope.serviceProvider._id,
                        slot: $scope.date.getTime(),
                        duration: $scope.duration,
                        user: $scope.user.email,
                        phone: $scope.contacts.phone,
                        address: $scope.contacts.address,
                        notes: $scope.contacts.notes,
                        dob: $scope.contacts.dob,
                        offset: window.moment().utcOffset(),
                        isHomeMassage: $scope.isHomeMassage
                    }).then(function () {
                        alerter.info('Sent booking request for ' + $scope.service.name + ' at ' + window.moment($scope.date).format('dddd, MMM Do, hh:mm') +
                            '. You will receive confirmation of your booking within one hour during business hours.', function () {
                                clear();

                                $timeout(function () {
                                    window.location.href = '/profile';
                                }, 100);
                            });
                    }).catch(handler);
                }

                function clear () {
                        $scope.selected = void 0;
                        $scope.user = void 0;
                        $scope.date = void 0;
                        $scope.duration = void 0;
                        $scope.phone = void 0;
                        $scope.dob = void 0;
                        $scope.fields = {};
                        $scope.contacts = {
                            returningUser: true
                        };
                        window.angular.element('#appointmentContactModal').modal('hide');
                        window.angular.element('#appointmentModal').modal('hide');
                }
            };

            $scope.isAvailable = function (/* date */) {
                return false;
            };

            $scope.onUpdateDuration = function (durationMask) {
                $scope.durationMask = durationMask;
            };

            $scope.clearSlot = function () {
            };

            $scope.signup = function (fields) {
                $http.post('/signup-user', fields)
                .then(function (result) {
                    $scope.user = result.data;
                    $scope.getContactData();
                })
                .catch(handler);
            };

            $scope.login = function (email, password) {
                $http.post('/login', {
                    email: email,
                    password: password
                }).then(function (result) {
                    $scope.user = result.data;
                    $scope.getContactData();
                }).catch(handler);
            };

            $scope.formatDate = function (date) {
                return window.moment(date).format('dddd, MMM Do, h:mmA');
            };

            var unsubscribe = $rootScope.$on('event:social-sign-in-success', function (event, userDetails) {
                $http.post('/social-login', {
                    idToken: userDetails.idToken,
                    token: userDetails.token,
                    uid: userDetails.uid,
                    email: userDetails.email,
                    name: userDetails.name,
                    provider: userDetails.provider
                }).then(function (result) {
                    $scope.user = result.data;
                    $scope.getContactData();
                }).catch(function (err) {
                    alerter.warning(err);
                });
            });

            $scope.$on('$locationChangeSuccess', function () {
                unsubscribe();
            });

            function initSlots () {
                utils.deleteMap($scope.slotsMap);
                $scope.allSlots.reduce(function (acc, slot) {
                    var key = utils.dateToSlot(slot.time);
                    acc[key] = slot;

                    return acc;
                }, $scope.slotsMap);

                utils.deleteMap($scope.durations);
                $scope.allSlots.reduce(function (acc, slot) {
                    acc[utils.dateToSlot(slot.time)] = utils.durationsToMask(slot.durations);
                    return acc;
                }, $scope.durations);
            }

            function saveUserData (cb) {
                $scope.savedUser = oo.clone($scope.user);
                if ($scope.contacts.phone) {
                    $scope.user.phone = $scope.contacts.phone;
                }
                if ($scope.contacts.dob) {
                    $scope.user.dob = $scope.contacts.dob;
                }
                if ($scope.contacts.address) {
                    $scope.user.address = $scope.contacts.address;
                }

                var diff = ooPatch.diff($scope.savedUser, $scope.user);

                $http.patch('/users/' + $scope.user._id, diff)
                    .then(cb)
                    .catch(handler);
            }

            function initEntities () {
                (new Slots()).subscribeAndStart($scope.serviceProvider, $scope.allSlots, function () {
                    initSlots();
                });

                (new Appointments()).subscribeAndStart($scope.serviceProvider, $scope.allAppointments, function () {
                    // Nothing for now
                });
            }

            initEntities();

            $scope.$watch('service', function (service) {
                if (!service) {
                    return;
                }
                $scope.isHomeMassage = ($scope.service.name === 'Registered Massage Therapy (In Home Service)') || ($scope.service.name === 'Chiropractor (In Home Service)') || ($scope.service.name === 'Physiotherapy (In Home Service)'); // XXX: this is brittle
                console.log($scope.isHomeMassage);
            });

            function getGeoLocationForUser() {
                $geoLocate().then(function (position) {
                    $scope.coords = position.coords;
                    reverseGeoCode();
                }, function (err) { // Probably geo location is off
                    $scope.coords = {
                        latitude: TORONTO_COORDS[0],
                        longitude: TORONTO_COORDS[1]
                    };
                    reverseGeoCode();
                });
    
            function reverseGeoCode () {
                $http.get('/reverse-geocode?longitude=' + $scope.coords.longitude + '&latitude=' + $scope.coords.latitude)
                    .then(function (result) {
                        if(!$scope.contacts.address && !$scope.user.address) {
                            $scope.contacts.address = extractAddress(result.data);
                        }
                        if($scope.user.address){
                            $scope.contacts.address = $scope.user.address;
                        }
                        utils.initTypeAhead(afterSelect);
                    });
            }
            function extractAddress (results) {
                return results[0].formatted_address;
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
                    $scope.contacts.address = item.description;
                }).catch(handler);
            }
        }
        
        },
        templateUrl: '/views/appointment.html'
    };
}]);
