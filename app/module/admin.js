var module = angular.module('wradmin', []);
module.controller('AdminCtrl', ['$scope', '$http', function ($scope, $http) {
    function init () {
        $http.get('/clients')
            .then(function (result) {
                var clients = result.data;

                var userIds = clients.map(function (client) {
                    return client.userId;
                });

                var inQuery = encodeURIComponent(JSON.stringify({
                    _id: {
                        $in: userIds
                    }
                }));
                $http.get('/users?q=' + inQuery)
                    .then(function (clients) {
                        $scope.clients = clients.data;
                    })
                    .catch(function (err) {
                        alert(JSON.stringify(err));
                        console.log(err);
                    });

                var ninQuery = encodeURIComponent(JSON.stringify({
                    _id: {
                        $nin: userIds
                    }
                }));
                $http.get('/users?q=' + ninQuery)
                    .then(function (users) {
                        $scope.users = users.data;
                    })
                    .catch(function (err) {
                        alert(JSON.stringify(err));
                        console.log(err);
                    });

                $http.get('/serviceproviders')
                    .then(function (serviceProvidersResult) {
                        $scope.serviceProvidersMap = serviceProvidersResult.data.reduce(function (acc, serviceProvider) {
                            acc[serviceProvider._id] = serviceProvider;
                            return acc;
                        }, {});
                        $http.get('/appointments')
                            .then(function (appointmentsResult) {
                                $scope.appointments = appointmentsResult.data;
                            })
                            .catch(function (err) {
                                alert(JSON.stringify(err));
                                console.log(err);
                            });
                    })
                    .catch(function (err) {
                        alert(JSON.stringify(err));
                        console.log(err);
                    });
            })
            .catch(function (err) {
                alert(JSON.stringify(err));
                console.log(err);
            });
    }

    $scope.getStatus = function (appointment) {
        return appointment.canceled ? 'Canceled' : appointment.rejected ? 'Rejected' : appointment.confirmed ? 'Confirmed' : 'Unanswered';
    };

    $scope.removeClient = function (client) {
        if (confirm('Are you sure? Deleting this client will remove all related data including service providers and appointments.')) {
            $http.delete('/users/' + client._id)
                .then(init)
                .catch(function (err) {
                    alert(JSON.stringify(err));
                    console.log(err);
                });
        }
    };

    $scope.removeUser = function (user) {
        if (confirm('Are you sure? Deleting this user will remove all related data including appointments.')) {
            $http.delete('/users/' + user._id)
                .then(init)
                .catch(function (err) {
                    alert(JSON.stringify(err));
                    console.log(err);
                });
        }
    };

    $scope.formatDate = function (date) {
        return window.moment(date).format('dddd, MMM Do, h:mm A');
    };

    init();
}]);
