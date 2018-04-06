angular.module('wellnessroom')
.directive('stripe', ['$http', 'handler', function ($http, handler) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            plan: '=',
            userId: '=',
            trial: '@'
        },
        link: function ($scope) {
            $http.get('/config')
                .then(function (result) {
                    var stripe = window.Stripe(result.data.stripePublicKey);
                    var elements = stripe.elements();

                    var style = {
                        base: {
//                            textAlign: 'center',
//                            lineHeight: '1.429'
                        }
                    };

                    var cardNumber = elements.create('cardNumber', {
                        style: style
                    });
                    cardNumber.mount('#card-number');
                    cardNumber.addEventListener('change', errorHandler);

                    var cardExpiry = elements.create('cardExpiry', {
                        style: style
                    });
                    cardExpiry.mount('#card-expiry');
                    cardExpiry.addEventListener('change', errorHandler);

                    var cardCode = elements.create('cardCvc', {
                        style: style
                    });
                    cardCode.mount('#card-code');
                    cardCode.addEventListener('change', errorHandler);

                    function errorHandler (event) {
                        var displayError = document.getElementById('card-errors');
                        if (event.error) {
                            displayError.textContent = event.error.message;
                        } else {
                            displayError.textContent = '';
                        }
                    }

                    var submitted = false;

                    $scope.submit = function () {
                        if (submitted) {
                            return;
                        }
                        submitted = true;

                        stripe.createToken(cardNumber).then(function(result) {
                            submitted = false;

                            if (result.error) {
                                var errorElement = document.getElementById('card-errors');
                                errorElement.textContent = result.error.message;
                            } else {
                                $http.post('/subscribe', {
                                    token: result.token,
                                    userId: $scope.userId,
                                    plan: $scope.plan,
                                    trial: !!$scope.trial
                                })
                                .then(function () {
                                    window.location.href = '/thank-you';
                                })
                                .catch(handler);
                            }
                        });
                    };
                })
                .catch(handler);
        },
        templateUrl: '/views/stripe.html'
    };
}]);
