angular.module('wellnessroom')
.service('handler', ['Alerter', function (Alerter) {
    var alerter = new Alerter();

    return function (err) {
        console.log(err);
        alerter.error(err);
    };
}]);
