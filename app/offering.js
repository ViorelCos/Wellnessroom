angular.module('wellnessroom')
.directive('offering', [function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            image: '@',
            text: '@',
            title: '@'
        },
//        link: function ($scope) {
//        },
        templateUrl: '/views/offering.html'
    };
}]);
