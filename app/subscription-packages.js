angular.module('wellnessroom')
.controller('SubscriptionPackagesCtrl', ['$scope', '$http', 'handler', function ($scope, $http, handler) {
    $http.get('/plans')
        .then(function (result) {
            $scope.ordinaryPlans = result.data.filter(function (plan) {
                return !plan.premium;
            }).sort(function (aPlan, anotherPlan) {
                return aPlan.priceCanadianCents - anotherPlan.priceCanadianCents;
            });

            $scope.premiumPlans = result.data.filter(function (plan) {
                return plan.premium;
            }).sort(function (aPlan, anotherPlan) {
                return aPlan.priceCanadianCents - anotherPlan.priceCanadianCents;
            });
        })
        .catch(handler);
}]);
