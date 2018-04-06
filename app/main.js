angular.module('wellnessroom')
.controller('MainCtrl', ['$scope', '$http', '$location', '$rootScope', '$route', 'Alerter', 'handler', function ($scope, $http, $location, $rootScope, $route, Alerter, handler) {
    var alerter = new Alerter();

    $rootScope.$on('$routeChangeSuccess', function (/* event, current, previous */) {
        $rootScope.pageTitle = $route.current.title;
    });

    $rootScope.backgroundImage = 'url(\'/img/slider/slider-white1.jpg\')';

    $scope.logout = function () {
        $http.get('/logout')
            .then(function () {
                window.location.href = '/';
            })
            .catch(handler);
    };

    if (window.PATH) {
        $location.replace(window.PATH);
    }

    if (window.bowser.msie) {
        alerter.warning('We have detected that you are using Internet Explorer. Unfortunately this site is not fully optimized to work with Internet Explorer and we suggest using another browser for a better online experience.');
    }
}]);
