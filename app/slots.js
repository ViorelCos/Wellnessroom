angular.module('wellnessroom')
.service('Slots', ['Entities', function (Entities) {
    function Slots () {
        Entities.call(this);
        this.entityName = 'slots';
        this.endpoint = '/' + this.entityName;
    }

    Slots.prototype = Object.create(Entities.prototype);
    Slots.prototype.constructor = Slots;

    return Slots;
}]);
