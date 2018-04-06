angular.module('wellnessroom')
.service('schedulingUtils', function () {
    return function (allAppointments) {
        return {
            isBooked: isBooked,
            isPending: isPending,
            isOverlapped: isOverlapped
        };

        function isBooked (date) {
            var appointment = forServiceProvider(allAppointments)[date.valueOf()];
            return appointment && appointment.slot === date.valueOf() && appointment.acknowledged && appointment.confirmed && !appointment.canceled;
        }

        function isPending (date) {
            var appointment = forServiceProvider(allAppointments)[date.valueOf()];
            return appointment && !appointment.acknowledged && !appointment.canceled && appointment.slot === date.valueOf();
        }

        function isOverlapped (date) {
            var appointments = possibleOverspanningAppointments(date);

            return appointments.length;
        }

        function possibleOverspanningAppointments (date) {
            return allAppointments.filter(function (a) {
                return a.slot !== date &&
                    !(a.canceled || a.rejected) &&
                    a.slot < date &&
                    a.slot + a.duration > date;
            });
        }

        function forServiceProvider (entities) {
            return entities.reduce(function (acc, entity) {
                acc[entity.slot] = entity;
                return acc;
            }, {});
        }
    };
});
