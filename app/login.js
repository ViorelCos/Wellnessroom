angular.module('wellnessroom')
.controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$location', '$routeParams', 'social', 'Alerter', 'handler', function ($scope, $rootScope, $http, $location, $routeParams, social, Alerter, handler) {
    var alerter = new Alerter();

    $rootScope.backgroundImage = 'white';

    $scope.fields = {};

    $scope.isHcp = $routeParams.hcp;
    $scope.signupLink = $routeParams.hcp ? '/#!/signup/hcp' : '/#!/signup';
    $scope.loginLink = $routeParams.hcp ? '/#!/login/hcp' : '/#!/login';

    $http.get('/config')
        .then(function (result) {
            $scope.googleRecaptchaPublicKey = result.data.googleRecaptchaPublicKey;
        })
        .catch(handler);

    $scope.signup = function (fields) {
        $rootScope.overrideHideSpinner = true;
        if (!$routeParams.hcp) {
            $http.post('/signup-user', fields)
            .then(function () {
                $rootScope.overrideHideSpinner = false;
                $location.url('/user-signup-done');
            })
            .catch(function (err) {
                $rootScope.overrideHideSpinner = false;
                alerter.warning(err);
            });
        } else {
            $http.post('/signup', Object.assign(fields, {
                planId: $routeParams.planid
            })).then(function () {
                $rootScope.overrideHideSpinner = false;
                $location.url('/signup-done');
            }).catch(function (err) {
                $rootScope.overrideHideSpinner = false;
                alerter.warning(err);
            });
        }
    };

    $scope.login = function (email, password) {
        $rootScope.overrideHideSpinner = true;
        $http.post('/login', {
            email: email,
            password: password
        }).then(function () {
            window.location.href = '/profile';
        }).catch(function (err) {
            $rootScope.overrideHideSpinner = false;
            alerter.warning(err);
        });
    };

    $scope.requestPasswordReset = function (email) {
        $http.post('/request-password-reset', {
            email: email
        }).then(function () {
            $location.url('/password-reset');
        }).catch(function (err) {
            alerter.warning(err);
        });
    };

    $scope.resetPassword = function (newPassword) {
        $http.post('/reset-password', {
            newPassword: newPassword,
            token: $routeParams.token
        }).then(function () {
            $location.url('/login');
        }).catch(function (err) {
            alerter.warning(err);
        });
    };

    var unsubscribe = $rootScope.$on('event:social-sign-in-success', function (event, userDetails) {
        $http.post('/social-login', {
            idToken: userDetails.idToken,
            token: userDetails.token,
            uid: userDetails.uid,
            email: userDetails.email,
            name: userDetails.name,
            provider: userDetails.provider,
            hcp: !!$routeParams.hcp
        }).then(function () {
            window.location.href = '/profile';
        }).catch(function (err) {
            alerter.warning(err);
        });
    });

    $scope.$on('$locationChangeSuccess', function () {
        unsubscribe();
    });
}]);
