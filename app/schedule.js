angular.module('wellnessroom')
.directive('schedule', [
    'utils',
    'MORNING_START',
    'MORNING_END',
    'AFTERNOON_START',
    'AFTERNOON_END',
    'EVENING_START',
    'EVENING_END',
    function (
        utils,
        MORNING_START,
        MORNING_END,
        AFTERNOON_START,
        AFTERNOON_END,
        EVENING_START,
        EVENING_END
    ) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            utils: '=',
            availability: '=',
            durations: '=',
            selectedSlot: '=',
            appointments: '=',
            slots: '=',
            daySelected: '=',
            hideBooked: '@',
            hidePast: '@'
        },
        link: function ($scope) {
            $scope.daySelected = window.moment();
            $scope.DAYS_WINDOW = 3;
            var current = $scope.daySelected.clone().add(1, 'months');
            $scope.days = [];
            do {
                $scope.days.unshift(current.clone());
                current = current.subtract(1, 'day');
            } while (!current.isSameOrBefore($scope.daySelected));
            $scope.days.unshift(current.clone());
            $scope.windowStart = 0;

            $scope.quadsForMorning = {};
            $scope.quadsForAfternoon = {};
            $scope.quadsForEvening = {};

            $scope.quater = 15 * 60 * 1000;
            $scope.half = 30 * 60 * 1000;
            $scope.threeQuaters = 45 * 60 * 1000;

            $scope.classesMap = {};

            $scope.calendar = function (day) {
                return day.calendar(null, {
                    sameDay: '[Today], MMM Do',
                    nextDay: 'MMM Do',
                    nextWeek: 'MMM Do',
                    sameElse: 'MMM Do'
                });
            };

            $scope.select = function (slot) {
                $scope.selectedSlot = slot;
            };

            $scope.selectDay = function (day) {
                $scope.daySelected = day;
            };

            function slotsForDay (day) {
                day = day || $scope.daySelected;

                $scope.morningSlots = {};
                $scope.afternoonSlots = {};
                $scope.eveningSlots = {};

                var dayStart = window.moment(day).startOf('day').valueOf();
                var displayDay = dayStart;

                generateSlots($scope.morningSlots, dayStart, displayDay, MORNING_START, MORNING_END);
                generateSlots($scope.afternoonSlots, dayStart, displayDay, AFTERNOON_START, AFTERNOON_END);
                generateSlots($scope.eveningSlots, dayStart, displayDay, EVENING_START, EVENING_END);

                $scope.quadsForMorning[day] = splitIntoQuads($scope.morningSlots);
                $scope.quadsForAfternoon[day] = splitIntoQuads($scope.afternoonSlots);
                $scope.quadsForEvening[day] = splitIntoQuads($scope.eveningSlots);
            }

            $scope.morningSlotsQuads = function (day) {
                return $scope.quadsForMorning[day] || slotsForDay(day) || $scope.quadsForMorning[day];
            };

            $scope.afternoonSlotsQuads = function (day) {
                return $scope.quadsForAfternoon[day] || slotsForDay(day) || $scope.quadsForAfternoon[day];
            };

            $scope.eveningSlotsQuads = function (day) {
                return $scope.quadsForEvening[day] || slotsForDay(day) || $scope.quadsForEvening[day];
            };

            function splitIntoQuads (slots) {
                var result = [];

                var counter = 0;
                var quad;
                for (var key in slots) {
                    if (counter % 4 === 0) {
                        quad = {};
                        result.push(quad);
                    }

                    quad[key] = slots[key];
                    counter++;
                }

                return result;
            }

            function generateSlots (obj, dayStart, displayDay, startTime, endTime) {
                var timespan = [];
                for (var start = startTime; start <= endTime; start += 15 * 60 * 1000) {
                    timespan.push(start);
                }

                timespan.forEach(function (start) {
                    var date = window.moment(dayStart + start);
                    var displayDate = window.moment(displayDay + start);

                    var booked = $scope.utils.isBooked(date);
                    var pending = $scope.utils.isPending(date);
                    var overlapped = $scope.utils.isOverlapped(date);

                    var key = displayDate.format('h:mm A');
                    var value = {
                        date: date.valueOf(),
                        displayDate: displayDate.valueOf(),
                        time: utils.dateToSlot(date),
                        booked: booked,
                        pending: pending,
                        overlapped: overlapped
                    };

                    var now = Date.now();
                    if ((typeof $scope.slots !== 'object' || $scope.slots[value.time]) &&
                        (!$scope.hidePast || value.date > now)) {
                        obj[key] = value;

                        $scope.classesMap[value.date] = function () {
                            return {
                                'btn-secondary-outlined': !overlapped && !value.pending && !$scope.availability[value.time] && $scope.selectedSlot !== value.time,
                                'btn-success': !overlapped && $scope.availability[value.time],
                                'btn-primary': $scope.selectedSlot === value.time,
                                'btn-warning': pending,
                                'btn-danger': booked,
                                'btn-inverse': overlapped,
                                'disabled': pending || booked || overlapped
                            };
                        };
                    }
                });
            }

            $scope.classes = function (value, offset) {
                return $scope.classesMap[value.date + (offset || 0)]();
            };

            $scope.clickHandler = function (value) {
                return !value.pending && !value.booked && !value.overlapped && $scope.select(utils.dateToSlot(value.date));
            };

            $scope.getWidth = function (value) {
                var key = utils.dateToSlot(value.displayDate);
                if (!value.overlapped && ($scope.durations === void 0 || ($scope.durations && !$scope.durations[key]))) {
                    return 0;
                }

                return '100%';
                /*
                if (!~$scope.durations[key]) { // No duration
                    return '100%';
                }

                return (($scope.durations[key] / $scope.quater) * 25)  + '%';
                */
            };

            function updateDayWindow (dir) {
                $scope.daysWindow = $scope.days.slice($scope.windowStart, $scope.windowStart + $scope.DAYS_WINDOW);

                if (!~$scope.daysWindow.indexOf($scope.daySelected)) {
                    $scope.daySelected = $scope.daysWindow[dir < 0 ? $scope.DAYS_WINDOW - 1 : 0];
                }
            }

            $scope.moveDayWindow = function (dir) {
                $scope.windowStart = Math.max(0, Math.min($scope.windowStart + dir, $scope.days.length - $scope.DAYS_WINDOW - 1));
                updateDayWindow(dir);
            };

            $scope.$watch('appointments', function (appointments) {
                if (appointments && $scope.slots) {
                    slotsForDay();
                }
            }, true);

            $scope.$watch('slots', function (slots) {
                if (slots && $scope.appointments) {
                    slotsForDay();
                }
            }, true);

            $scope.moveDayWindow(0);
        },
        templateUrl: '/views/schedule.html'
    };
}]);
