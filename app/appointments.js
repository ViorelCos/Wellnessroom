angular.module('wellnessroom')
.service('Appointments', ['Entities', function (Entities) {
    function Appointments () {
        Entities.call(this);
        this.entityName = 'appointments';
        this.endpoint = '/' + this.entityName;
    }

    Appointments.prototype = Object.create(Entities.prototype);
    Appointments.prototype.constructor = Appointments;

    return Appointments;
}]);
