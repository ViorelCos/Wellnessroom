angular.module('wellnessroom')
.controller('SubscriptionsCtrl', ['$rootScope', '$scope', '$http', 'Alerter', 'handler', function ($rootScope, $scope, $http, Alerter, handler) {
    $rootScope.backgroundImage = 'white';

    var alerter = new Alerter();
    var ooPatch = window.JSON8Patch;
    var oo = window.JSON8;

    $http.get('/users/' + window.USER_ID)
        .then(function (result) {
            $scope.user = result.data;

            $http.get('/plans')
                .then(function (result) {
                    $scope.plansMap = result.data.reduce(function (acc, plan) {
                        acc[plan._id] = plan;
                        return acc;
                    }, {});

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
                        userId: $scope.user._id
                    }));

                    $http.get('/orders?q=' + query)
                        .then(function (result) {
                            $scope.orders = result.data.sort(function (anOrder, anotherOrder) {
                                return anOrder.date - anotherOrder.date;
                            });

                            $scope.order = $scope.orders[$scope.orders.length - 1];

                            $http.get('/clients?q=' + query)
                                .then(function (result) {
                                    $scope.client = result.data[0];
                                    $scope.savedClient = oo.clone($scope.client);
                                })
                                .catch(handler);
                        })
                        .catch(handler);
                });
        })
        .catch(handler);

    $scope.update = function (plan) {
        if (plan.serviceProviders < $scope.client.serviceProviders.length) {
            alerter.confirm('Please note the number of service providers will be restricted to the plan you choose.', function (result) {
                if (result.value) {
                    cont();
                }
            });
        } else {
            alerter.confirm('You are about to change your current subscription plan.', function (result) {
                if (result.value) {
                    cont();
                }
            });
        }

        function cont () {
            $rootScope.overrideHideSpinner = true;
            $http.post('/subscribe', {
                userId: $scope.user._id,
                plan: plan
            }).then(function () {
                $scope.client.serviceProviders.splice(plan.serviceProviders);
                var diff = ooPatch.diff($scope.savedClient, $scope.client);

                $http.patch('/clients/' + $scope.client._id, diff)
                    .then(function (result) {
                        $scope.client = result.data;
                        $scope.savedClient = oo.clone($scope.client);

                        window.location.href = '/subscriptions';
                    })
                    .catch(handler).finally(function () {
                        $rootScope.overrideHideSpinner = false;
                    });
            }).catch(function (err) {
                handler(err);
                $rootScope.overrideHideSpinner = false;
            });
        }
    };

    $scope.cancel = function () {
        alerter.confirm('Please confirm that you wish to cancel your WellnessRoom subscription. You won\'t be able to login after that.', function (result) {
            if (result.value) {
                $rootScope.overrideHideSpinner = true;
                $http.post('/unsubscribe', {
                    userId: $scope.user._id
                }).then(function () {
                    window.location.href = '/unsubscribed';
                }).catch(handler).finally(function () {
                    $rootScope.overrideHideSpinner = false;
                });
            }
        });
    };

    $scope.maybeShowTrial = function () {
        if ($scope.order && $scope.order.trial) {
            return ' (trial)';
        }

        return '';
    };
}]);
