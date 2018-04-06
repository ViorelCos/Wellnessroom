angular.module('wellnessroom')
.controller('RateAppointmentCtrl', ['$scope', '$http', 'Services', 'Alerter', 'handler', function ($scope, $http, Services, Alerter, handler) {
    var ooPatch = window.JSON8Patch;
    var oo = window.JSON8;
    var alerter = new Alerter();
    var services = new Services();

    $http.get('/appointments/' + window.APPOINTMENT_ID)
        .then(function (result) {
            initAppointment(result.data);

            services.withServices(function (err, maps) {
                if (err) {
                    return handler(err);
                }

                $scope.serviceProvider = maps.serviceProvidersMap[result.data.serviceProvider];
            });
        })
        .catch(handler);

    $scope.ratingChanged = function (event) {
        if (!event.rating) {
            return;
        }

        $scope.appointment.rating = event.rating;
    };

    $scope.save = function () {
        var diff = ooPatch.diff($scope.savedAppointment, $scope.appointment);

        $http.patch('/appointments/' + $scope.appointment._id, diff)
            .then(function (result) {
                initAppointment(result.data);
                alerter.info('Thank you! Your rating has been saved.');
            })
            .catch(handler);
    };

    function initAppointment (appointment) {
        $scope.appointment = appointment;
        $scope.savedAppointment = oo.clone($scope.appointment);
    }
}]);
