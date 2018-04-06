angular.module('wellnessroom')
.controller('ProviderProfileCtrl', [
    '$scope',
    '$routeParams',
    '$http',
    'DURATIONS_CONSTANTS',
    'Slots',
    'Appointments',
    'utils',
    'handler',
    'schedulingUtils',
        function (
            $scope,
            $routeParams,
            $http,
            DURATIONS_CONSTANTS,
            Slots,
            Appointments,
            utils,
            handler,
            schedulingUtils
        ) {
    var ooPatch = window.JSON8Patch;
    var oo = window.JSON8;

    $scope.slotsMap = {};
    $scope.durations = {};
    $scope.availability = {};
    $scope.allAppointments = [];
    $scope.slots = [];
    $scope.serviceProvider = {};
    $scope.daySelected = new Date();

    $scope.sUtils = schedulingUtils($scope.allAppointments);

    $http.get('/serviceproviders/' + $routeParams.id)
        .then(function (result) {
            Object.assign($scope.serviceProvider, result.data);
            $scope.savedServiceProvider = oo.clone($scope.serviceProvider);

            (new Slots()).subscribeAndStart($scope.serviceProvider, $scope.slots, function () {
                initSlots();
            });

            (new Appointments()).subscribeAndStart($scope.serviceProvider, $scope.allAppointments, function () {
            });
        })
        .catch(handler);

    $scope.saveServiceProvider = function () {
        var diff = ooPatch.diff($scope.savedServiceProvider, $scope.serviceProvider);

        $http.patch('/serviceproviders/' + $scope.serviceProvider._id, diff)
            .then(function (result) {
                utils.deleteMap($scope.serviceProvider);
                Object.assign($scope.serviceProvider, result.data);
                $scope.savedServiceProvider = oo.clone($scope.serviceProvider);
            })
            .catch(handler);
    };

    $scope.onUpdateDuration = function (durationMask) {
        $scope.durationMask = durationMask;
    };

    $scope.clearSlot = function () {
        var key = utils.slotToDate($scope.daySelected, $scope.selected);
        var slot = $scope.slotsMap[key];
        if (!slot) {
            return;
        }

        $http.delete('/slots/' + slot._id)
            .then(function () {
                $scope.selected = void 0;
            })
            .catch(handler);
    };

    $scope.isSlot = function () {
        return true;
    };

    function setAvailable (selected, durations) {
        if ($scope.availability[selected]) { // Patch
            var slot = $scope.slotsMap[utils.slotToDate($scope.daySelected, selected)];
            slot.durations = durations;
            var diff = ooPatch.diff($scope.savedSlotsMap[slot._id], slot);

            $http.patch('/slots/' + slot._id, diff)
                .then(function () {
                    $scope.selected = void 0;
                })
                .catch(handler);
        } else { // Post
            $http.post('/slots', {
                serviceProvider: $scope.serviceProvider._id,
                time: utils.slotToDate($scope.daySelected, selected),
                durations: durations
            }).then(function () {
                $scope.selected = void 0;
            }).catch(handler);
        }
    }

    function openDurationModal () {
        $scope.durationMask = void 0;

        window.angular.element('#durationModal').modal('show');
        window.angular.element('#durationModal').on('hide.bs.modal', function () {
            window.angular.element('#durationModal').off('hide.bs.modal');
            if ($scope.durationMask) {
                setAvailable($scope.selected, utils.maskToDurations($scope.durationMask));
                $scope.durationMask = void 0;
            }
            $scope.selected = void 0;
        });
    }

    $scope.$watch('selected', function (selected) {
        if (!selected) {
            return;
        }

        openDurationModal();
    });

    function initSlots () {
        utils.deleteMap($scope.slotsMap);
        $scope.slots.reduce(function (acc, slot) {
            acc[slot.time] = slot;
            return acc;
        }, $scope.slotsMap);

        $scope.savedSlotsMap = $scope.slots.reduce(function (acc, slot) {
            acc[slot._id] = oo.clone(slot);
            return acc;
        }, {});

        utils.deleteMap($scope.availability);
        $scope.slots.reduce(function (acc, slot) {
            acc[utils.dateToSlot(slot.time)] = true;
            return acc;
        }, $scope.availability);

        utils.deleteMap($scope.durations);
        $scope.slots.reduce(function (acc, slot) {
            acc[utils.dateToSlot(slot.time)] = utils.durationsToMask(slot.durations);
            return acc;
        }, $scope.durations);
    }
}]);
