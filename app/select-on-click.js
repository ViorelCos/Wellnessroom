angular.module('wellnessroom')
.directive('selectOnClick', ['$window', function ($window) {
    return {
        restrict: 'A',
        scope: false,
        link: function ($scope, el) {
            el.on('focus', function () {
                if (!$window.getSelection().toString()) {
                    this.setSelectionRange(0, this.value.length);
                }
            });
        }
    };
}]);
