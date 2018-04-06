angular.module('wellnessroom')
.service('utils', ['$http', 'DURATIONS_CONSTANTS', 'handler', function ($http, DURATIONS_CONSTANTS, handler) {
    return {
        deleteMap: deleteMap,
        durationsToMask: durationsToMask,
        maskToDurations: maskToDurations,
        dateToSlot: dateToSlot,
        slotToDate: slotToDate,
        unique: unique,
        initTypeAhead: initTypeAhead,
        limitTo: limitTo
    };

    function deleteMap (map) {
        for (var key in map) {
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                delete map[key];
            }
        }
    }

    function durationsToMask (durations) {
        return DURATIONS_CONSTANTS.filter(function (d) {
            return ~durations.indexOf(d.time);
        }).reduce(function (acc, d) {
            return acc | d.mask;
        }, 0);
    }

    function maskToDurations (mask) {
        return DURATIONS_CONSTANTS.filter(function (d) {
            return d.mask & mask;
        }).map(function (d) {
            return d.time;
        });
    }

    function dateToSlot (date) {
        return window.moment(date).format('YYYY-MM-DDTHH:mm');
    }

    function slotToDate (day, slot) {
        return window.moment(slot).valueOf();
    }

    function unique (arr) {
        return Object.keys(arr.reduce(function (acc, el) {
            acc[el] = true;
            return acc;
        }, {}));
    }

    function initTypeAhead (afterSelect) {
        window.angular.element('#location-search').typeahead({
            source: function (query, process) {
                if (query) {
                    withPlaces(query, function (err, result) {
                        if (err) {
                            return handler(err);
                        }

                        return process(result.data.map(function (address) {
                            return {
                                placeId: address.place_id,
                                description: address.description
                            };
                        }));
                    });
                }
            },
            displayText: function (item) {
                return item.description;
            },
            matcher: function (item) {
                return window.fuzzy.fuzzyMatchPattern(item, this.query);
            },
            afterSelect: afterSelect,
            minLength:3,
            delay: 200
        });
    }

    function withPlaces (query, cb) {
        $http.get('/map-autocomplete?input=' + encodeURIComponent(query))
            .then(cb.bind(null, null))
            .catch(handler);
    }

    function limitTo (str, len) {
        if (str) {
            var truncated = str.slice(0, len);
            if (truncated.length < str.length) {
                return truncated + '...';
            }

            return str;
        }
    }
}]);
