angular.module('wellnessroom')
.directive('durationPicker', ['$timeout', 'DURATIONS_CONSTANTS', function ($timeout, DURATIONS_CONSTANTS) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            selectedSlot: '=',
            onDurationUpdate: '=',
            onClear: '=',
            slotDurations: '=',
            pickMode: '@'
        },
        link: function ($scope) {
            $scope.durations = [];

            $scope.toggleDuration = function (mask) {
                if ($scope.pickMode) {
                    $scope.selectedDuration = mask;
                } else {
                    if (mask & $scope.durations[0].mask) {
                        $scope.selectedDuration &= ~$scope.hasDurationMask;
                        $scope.selectedDuration ^= mask;
                    } else {
                        $scope.selectedDuration &= $scope.hasDurationMask;
                        $scope.selectedDuration ^= mask;
                    }
                }
            };

            $scope.isSelected = function (mask) {
                return $scope.selectedDuration & mask;
            };

            $scope.cancel = function () {
                close();
            };

            $scope.saveDuration = function () {
                $scope.onDurationUpdate($scope.selectedDuration);
                close();
            };

            $scope.clearSlot = function () {
                $scope.selectedDuration = $scope.durations[0].mask;
                $scope.onClear();
                close();
            };

            function close () {
                $timeout(function () {
                    window.angular.element('#durationModal').modal('hide');
                }, 10);
            }

            function filterDurations () {
                $scope.durations = DURATIONS_CONSTANTS.filter(function (duration) {
                    return !$scope.pickMode || $scope.slotDurations[$scope.selectedSlot] & duration.mask;
                });

                $scope.hasDurationMask = $scope.durations.reduce(function (acc, duration, idx) {
                    if (idx === 0) {
                        return acc;
                    }

                    return acc | duration.mask;
                }, 0);
            }

            $scope.$watch('selectedSlot', function (selectedSlot) {
                if (!selectedSlot) {
                    return;
                }

                if ($scope.pickMode) {
                    var slotMask = $scope.slotDurations[$scope.selectedSlot];

                    $scope.selectedDuration = $scope.durations.reduce(function (acc, duration) {
                        return acc || duration.mask & slotMask;
                    }, 0);
                } else {
                    $scope.selectedDuration = $scope.slotDurations[$scope.selectedSlot] || DURATIONS_CONSTANTS[0].mask;
                }

                filterDurations();
            });
        },
        templateUrl: '/views/duration-picker.html'
    };
}]);
