angular.module('wellnessroom')
.directive('offeringHorizontal', [function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            image: '@',
            text: '@',
            title: '@',
            swap: '@'
        },
        templateUrl: '/views/offering-horizontal.html'
    };
}]);
