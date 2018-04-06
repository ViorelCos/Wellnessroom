angular.module('wellnessroom')
.controller('SearchMapCtrl', [
    '$scope',
    '$routeParams',
    '$http',
    'handler',
    'utils',
    'schedulingUtils',
    'MORNING_START',
    'AFTERNOON_START',
    'EVENING_START',
    'DAY_END',
    function (
        $scope,
        $routeParams,
        $http,
        handler,
        utils,
        schedulingUtils,
        MORNING_START,
        AFTERNOON_START,
        EVENING_START,
        DAY_END
    ) {
        setTimeout(function(){
            var myEl = angular.element( document.querySelector( 'div.modal-backdrop' ) );
            myEl.empty();
            myEl.remove();
            angular.element(document.querySelector("body")).removeClass("modal-open");
        }, 1000)
    $scope.latitude = $routeParams.latitude;
    $scope.longitude = $routeParams.longitude;
    $scope.selectedService = $routeParams.serviceid;
    $scope.utils = utils;

    var now = window.moment();
    var inAMonth = now.clone().add(1, 'month');

    $scope.dates = [];
    var current = now;
    while (current.isSameOrBefore(inAMonth)) {
        $scope.dates.push({
            value: current.format('dddd, MMM Do'),
            start: current.startOf('day').valueOf(),
            end: current.endOf('day').valueOf()
        });
        current.add(1, 'day');
    }
    $scope.dates.unshift({
        value: 'Any Date'
    });

    $scope.times = [{
        value: 'Any Time'
    }, {
        value: '<i class="wi wi-fw wi-horizon-alt"></i> (Until 12pm)',
        start: MORNING_START - window.moment().utcOffset() * 60 * 1000,
        end: AFTERNOON_START - window.moment().utcOffset() * 60 * 1000
    }, {
        value: '<i class="wi wi-fw wi-day-sunny"></i> (12pm-5pm)',
        start: AFTERNOON_START - window.moment().utcOffset() * 60 * 1000,
        end: EVENING_START - window.moment().utcOffset() * 60 * 1000
    }, {
        value: '<i class="fa fa-moon-o"></i> (from 5pm)',
        start: EVENING_START - window.moment().utcOffset() * 60 * 1000,
        end: DAY_END - window.moment().utcOffset() * 60 * 1000
    }];

    $scope.ratings = [{
        value: 5
    }, {
        value: 4
    }, {
        value: 3
    }, {
        value: 2
    }, {
        value: 1
    }];

    $scope.selectedDate = $scope.dates[0];
    $scope.selectedTime = $scope.times[0];
    $scope.selectedRatings = {};

    function search () {
        $http.post('/search', {
            serviceId: $scope.selectedService,
            lat: $scope.latitude,
            lng: $scope.longitude
        }).then(function (result) {
            $scope.clients = result.data;

            $http.get('/users?q=' + encodeURIComponent(JSON.stringify({
                _id: {
                    $in: result.data.map(function (client) {
                        return client.userId;
                    })
                }
            }))).then(function (usersResult) {
                var ordersQuery = encodeURIComponent(JSON.stringify({
                    userId: usersResult.data.map(function (user) {
                        return user._id;
                    })
                }));

                $http.get('/plans')
                    .then(function (plansResult) {
                        var plansMap = plansResult.data.reduce(function (acc, plan) {
                            acc[plan._id] = plan;
                            return acc;
                        }, {});
                        $http.get('/orders?q=' + ordersQuery)
                            .then(function (ordersResult) {
                                var ordersMap = ordersResult.data.reduce(function (acc, order) {
                                    var thisOrder = acc[order.userId];
                                    if (!thisOrder) {
                                        acc[order.userId] = order;
                                    } else {
                                        acc[order.userId] = thisOrder.date < order.date ? order : thisOrder;
                                    }

                                    return acc;
                                }, {});

                                $http.get('/services')
                                    .then(function (servicesResult) {
                                        $scope.services = servicesResult.data;
                                        $scope.servicesMap = $scope.services.reduce(function (acc, service) {
                                            acc[service._id] = service;
                                            return acc;
                                        }, {});

                                        var query = encodeURIComponent(JSON.stringify({
                                            _id: {
                                                $in: $scope.clients.reduce(function (acc, client) {
                                                    return acc.concat(client.serviceProviders);
                                                }, [])
                                            },
                                            service: $scope.selectedService
                                        }));

                                        $http.get('/serviceproviders?q=' + query)
                                            .then(function (serviceProvidersResult) {
                                                $scope.clientsMap = $scope.clients.reduce(function (acc, client) {
                                                    return client.serviceProviders.reduce(function (innerAcc, sp) {
                                                        innerAcc[sp] = client;
                                                        return innerAcc;
                                                    }, acc);
                                                }, {});

                                                $scope.serviceProviders = serviceProvidersResult.data.map(function (sp) {
                                                    return Object.assign(sp, {
                                                        rating: getRating($scope.clientsMap[sp._id], sp._id),
                                                        firstOpening: getFirstOpening($scope.clientsMap[sp._id], sp._id),
                                                        premium: (plansMap[(ordersMap[$scope.clientsMap[sp._id].userId] || {}).planId] || {
                                                            premium: false
                                                        }).premium
                                                    });
                                                });

                                                $scope.serviceProvidersMap = $scope.serviceProviders.reduce(function (acc, sp) {
                                                    var spList = acc[$scope.clientsMap[sp._id]._id];
                                                    if (!spList) {
                                                        acc[$scope.clientsMap[sp._id]._id] = [sp];
                                                    } else {
                                                        spList.push(sp);
                                                    }
                                                    return acc;
                                                }, {});

                                                $scope.users = usersResult.data;
                                                $scope.usersMap = $scope.users.reduce(function (acc, user) {
                                                    acc[user._id] = user;
                                                    return acc;
                                                }, {});
                                            })
                                            .catch(handler);
                                })
                                .catch(handler);
                        })
                        .catch(handler);
                    })
                    .catch(handler);
            })
            .catch(handler);
        })
        .catch(handler);
    }

    search();

    function getRating (client, serviceProviderId) {
        var appointmentsWithRating = (client.appointmentsMap[serviceProviderId] || []).filter(function (app) {
            return app.rating;
        });

        return appointmentsWithRating.reduce(function (acc, app) {
            return acc + app.rating;
        }, 0) / appointmentsWithRating.length;
    }

    function getFirstOpening (client, serviceProviderId) {
        var sUtils = schedulingUtils(client.appointmentsMap[serviceProviderId] || []);
        var slots = client.slotsMap[serviceProviderId] || [];

        var now = Date.now();
        var future = 1e20;
        var firstOpening = (slots || []).filter(function (slot) {
            return slot.time > now && insideHours(slot.time) && !sUtils.isOverlapped(slot.time) &&
                !sUtils.isBooked(slot.time) && !sUtils.isPending(slot.time);
        }).reduce(function (acc, slot) {
            return Math.min(acc, slot.time);
        }, future);

        return firstOpening === future || firstOpening === now ? void 0 : firstOpening;
    }

    function insideHours (time) {
        var moment = window.moment(time);
        var startOfDay = moment.clone().startOf('day');

        var startHour = startOfDay.valueOf() + MORNING_START;
        var endHour = startOfDay.valueOf() + DAY_END;

        return startHour <= time && time < endHour;
    }

    $scope.shortAddress = function (address) {
        try {
            var split = address.split(', ');
            return [split[1], split[2].split(' ')[0]].join(', ');
        } catch (e) {
            return '';
        }
    };

    $scope.formatDate = function (timestamp) {
        if (!timestamp) {
            return;
        }

        //return [' Avail', window.moment(timestamp).format('ddd h:mm A')].join(' ');
        return [' Avail', window.moment(timestamp).calendar()].join(' ');
    };

    $scope.filterDate = function (date) {
        $scope.selectedDate = date;
    };

    $scope.filterTime = function (time) {
        if (!time.start) {
            $scope.selectedTime = false;
        }
        $scope.selectedTime = time;
    };

    $scope.filterRating = function (rating) {
        $scope.selectedRatings[rating] = !$scope.selectedRatings[rating];
    };
}]).filter('spFilter', ['slotService', function (slotService) {
    return function (values, selectedDate, selectedTime, selectedRatings, clientsMap) {
        return values && values.filter(function (value) {
            var ratingMatches = (!Object.values(selectedRatings).reduce(function (acc, flag) {
                return acc || flag;
            }, false) || selectedRatings[Math.floor(value.rating)] || selectedRatings[Math.ceil(value.rating)]);

            if (!ratingMatches) {
                return false;
            }

            if (selectedDate.start) {
                if (selectedTime.start) {
                    return slotService.dateAndTimeAvailable(selectedDate, selectedTime, clientsMap[value._id].slotsMap[value._id]);
                } else {
                    return slotService.dateAvailable(selectedDate, clientsMap[value._id].slotsMap[value._id]);
                }
            } else {
                if (selectedTime.start) {
                    return slotService.timeAvailable(selectedTime, clientsMap[value._id].slotsMap[value._id]);
                } else {
                    return true;
                }
            }
        });
    };
}]).filter('clientFilter', ['slotService', function (slotService) {
    return function (values, selectedDate, selectedTime, selectedRatings, serviceProvidersMap) {
        return values && values.filter(function (value) {
            if (!serviceProvidersMap[value._id]) {
               return false;
            }

            var ratings = serviceProvidersMap[value._id].map(function (sp) {
                return sp.rating;
            });

            var ratingMatches = !Object.values(selectedRatings).reduce(function (acc, flag) {
                return acc || flag;
            }, false) || !!ratings.filter(function (rating) {
                return selectedRatings[Math.floor(rating)] || selectedRatings[Math.ceil(rating)];
            });

            if (!ratingMatches) {
                return false;
            }
            
            if (selectedDate.start) {
                if (selectedTime.start) {
                    return slotService.dateAndTimeAvailable(selectedDate, selectedTime, flatten(value.slotsMap));
                } else {
                    return slotService.dateAvailable(selectedDate, flatten(value.slotsMap));
                }
            } else {
                if (selectedTime.start) {
                    return slotService.timeAvailable(selectedTime, flatten(value.slotsMap));
                } else {
                    return true;
                }
            }

            function flatten (slotsMap) {
                return Object.values(slotsMap).reduce(function (acc, v) {
                    return acc.concat(v);
                }, []);
            }
        });
    };
}]).service('slotService', [function () {
    return {
        dateAvailable: dateAvailable,
        timeAvailable: timeAvailable,
        dateAndTimeAvailable: dateAndTimeAvailable
    };

    function dateAvailable (date, slots) {
        if(!date || !slots) {
            return false;
        }
        return !!slots.find(function (slot) {
            return date.start <= slot.time && slot.time <= date.end;
        });
    }

    function timeAvailable (time, slots) {
        if(!time || !slots) {
            return false;
        }
        return !!slots.find(function (slot) {
            var timeOnly = slot.time % (24 * 60 * 60 * 1000);

            return time.start <= timeOnly && timeOnly <= time.end;
        });
    }

    function dateAndTimeAvailable (date, time, slots) {
        if(!date || !slots) {
            return false;
        }
        return !!slots.find(function (slot) {
            var timeOnly = slot.time % (24 * 60 * 60 * 1000);

            return date.start <= slot.time && slot.time <= date.end &&
                time.start <= timeOnly && timeOnly <= time.end;
        });
    }
}]);
