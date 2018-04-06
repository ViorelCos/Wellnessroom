angular.module('wellnessroom')
.controller('AppointmentsListCtrl', [
    '$scope',
    '$http',
    'Services',
    'handler',
    'Alerter',
    function (
        $scope,
        $http,
        Services,
        handler,
        Alerter
    ) {
    var alerter = new Alerter();
    var services = new Services();
    $scope.isClient = window.IS_CLIENT;

    if ($scope.isClient) {
        $http.get('/clients?q=' + encodeURIComponent(JSON.stringify({
            userId: window.USER_ID
        }))).then(function (result) {
            var appointmentsQuery = encodeURIComponent(JSON.stringify({
                serviceProvider: {
                    $in: result.data[0].serviceProviders
                }
            }));
            $http.get('/appointments?q=' + appointmentsQuery)
                .then(function (appointmentsResult) {
                    var usersQuery = encodeURIComponent(JSON.stringify({
                        email: {
                            $in: appointmentsResult.data.map(function (appointment) {
                                return appointment.user;
                            })
                        }
                    }));
                    $http.get('/users?q=' + usersQuery)
                        .then(function (userResult) {
                            $scope.usersMap = userResult.data.reduce(function (acc, user) {
                                acc[user.email] = user;
                                return acc;
                            }, {});
                            services.withServices(function (err, maps) {
                                $scope.servicesProvidersMap = maps.serviceProvidersMap;
                                $scope.appointments = appointmentsResult.data;
                            });
                        })
                        .catch(handler);
                })
                .catch(handler);
        }).catch(handler);
    } else {
        $http.get('/users/' + window.USER_ID)
            .then(function (userResult) {
                var appointmentsQuery = encodeURIComponent(JSON.stringify({
                    user: userResult.data.email
                }));
                $http.get('/appointments?q=' + appointmentsQuery)
                    .then(function (appointmentsResult) {
                        services.withServices(function (err, maps) {
                            $scope.servicesProvidersMap = maps.serviceProvidersMap;
                            $scope.appointments = appointmentsResult.data;
                        });
                    })
                    .catch(handler);
            })
            .catch(handler);
    }

    $scope.formatDate = function (timestamp) {
        return window.moment(timestamp).format('dddd, MMM Do, h:mm A');
    };

    $scope.getStatus = function (appointment) {
        return appointment.canceled ? 'Canceled' : appointment.rejected ? 'Rejected' : appointment.confirmed ? 'Confirmed' : 'Unanswered';
    };

    $scope.canCancel = function (appointment) {
        return !appointment.canceled && !appointment.rejected && appointment.slot > Date.now() + 24 * 60 * 60 * 1000;
    };

    $scope.cancel = function (appointment) {
        $http.get('/cancel-appointments?appointmentid=' + appointment._id)
            .then(function () {
                alerter.info('Cancelation email sent.');
            })
            .catch(handler);
    };

    $scope.maybeFullname = function (appointment) {
        return $scope.isClient ? $scope.usersMap[appointment.user].fullname + ', ': '';
    };

    $scope.maybeEmail = function (email) {
        return $scope.isClient ? email + ' ' : '';
    };
}]);
