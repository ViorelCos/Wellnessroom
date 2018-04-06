angular.module('wellnessroom')
.controller('ActivationCtrl', ['$scope', '$http', '$routeParams', 'handler', function ($scope, $http, $routeParams, handler) {
    $scope.userId = $routeParams.userid;

    $http.get('/plans')
        .then(function (result) {
            if ($routeParams.planid) {
                $scope.selectedPlan = result.data.find(function (plan) {
                    return plan._id === $routeParams.planid;
                });
            }

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


            var query = encodeURIComponent(JSON.stringify({
                userId: $scope.userId
            }));

            $http.get('/orders?q=' + query)
                .then(function (result) {
                    $scope.hasPlan = result.data.length > 0;
                })
                .catch(handler);
        })
        .catch(handler);

    $scope.updatePlan = function (plan) {
        $http.post('/subscribe', {
            userId: $scope.userId,
            plan: plan
        })
        .then(function () {
            window.location.href = '/thank-you';
        })
        .catch(handler);
    };
}]);
