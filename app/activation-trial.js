angular.module('wellnessroom')
.controller('ActivationTrialCtrl', ['$scope', '$http', '$routeParams', 'handler', function ($scope, $http, $routeParams, handler) {
    $scope.userId = $routeParams.userid;

    $http.get('/plans')
        .then(function (result) {
            $scope.plan = result.data.find(function (plan) {
                return plan._id === $routeParams.planid;
            });
        })
        .catch(handler);
}]);
