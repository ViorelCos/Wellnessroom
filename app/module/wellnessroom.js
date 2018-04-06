angular.module('wellnessroom', ['ngRoute', 'ngSanitize', 'uiCropper', 'GeoLocate.Service', 'GoogleMapsNative', 'socialbase.sweetAlert', 'star-rating', 'vcRecaptcha', 'socialLogin'])
.config(['$routeProvider', '$locationProvider', '$httpProvider', 'socialProvider', 'GOOGLE_PLUS_API_KEY', 'FACEBOOK_APP_ID', function ($routeProvider, $locationProvider, $httpProvider, socialProvider, GOOGLE_PLUS_API_KEY, FACEBOOK_APP_ID) {
    $routeProvider
        .when('/', {
            templateUrl: '/views/home.html',
            controller: 'WellnessRoomCtrl',
            title: 'Find Service Providers'
        })
        .when('/search-map/:serviceid/:latitude/:longitude', {
            templateUrl: '/views/search-map.html',
            controller: 'SearchMapCtrl',
            title: 'Pick Service Provider'
        })
        .when('/login', {
            templateUrl: '/views/login.html',
            controller: 'LoginCtrl',
            title: 'Login'
        })
        .when('/signup', {
            templateUrl: '/views/signup.html',
            controller: 'LoginCtrl',
            title: 'Signup'
        })
        .when('/login/:hcp', {
            templateUrl: '/views/login.html',
            controller: 'LoginCtrl',
            title: 'Login'
        })
        .when('/signup/:hcp', {
            templateUrl: '/views/signup.html',
            controller: 'LoginCtrl',
            title: 'Signup'
        })
        .when('/signup/:planid', {
            templateUrl: '/views/signup.html',
            controller: 'LoginCtrl',
            title: 'Signup'
        })
        .when('/signup-done', {
            templateUrl: '/views/signup-done.html',
            controller: 'LoginCtrl',
            title: 'Thank You for Signing up'
        })
        .when('/user-signup-done', {
            templateUrl: '/views/user-signup-done.html',
            controller: 'LoginCtrl',
            title: 'Thank You for Signing up'
        })
        .when('/forgot-password', {
            templateUrl: '/views/forgot-password.html',
            controller: 'LoginCtrl',
            title: 'Reset Your Password'
        })
        .when('/password-reset', {
            templateUrl: '/views/password-reset.html',
            controller: 'LoginCtrl',
            title: 'Your Request Has Been Sent'
        })
        .when('/reset-password/:token', {
            templateUrl: '/views/reset-password.html',
            controller: 'LoginCtrl',
            title: 'Enter Your New Password'
        })
        .when('/activate/:userid', {
            templateUrl: '/views/activate.html',
            controller: 'ActivationCtrl',
            title: 'Activate Your Account'
        })
        .when('/activate/:userid/:planid', {
            templateUrl: '/views/activate.html',
            controller: 'ActivationCtrl',
            title: 'Activate Your Account'
        })
        .when('/activate-payment/:userid/:planid', {
            templateUrl: '/views/activate-payment.html',
            controller: 'ActivationPaymentCtrl',
            title: 'Please Complete Your Activation'
        })
        .when('/activate-trial/:userid/:planid', {
            templateUrl: '/views/activate-trial.html',
            controller: 'ActivationTrialCtrl',
            title: 'Please Complete Your Activation'
        })
        .when('/thank-you', {
            templateUrl: '/views/thank-you.html',
            controller: 'LoginCtrl',
            title: 'Thank You'
        })
        .when('/profile', {
            templateUrl: '/views/profile.html',
            controller: 'ProfileCtrl',
            title: 'Profile'
        })
        .when('/clientpage/:id/serviceprovider/:serviceproviderid', {
            templateUrl: '/views/clientpage.html',
            controller: 'ClientCtrl',
            title: 'Service Provider'
        })
        .when('/provider-profile/:id', {
            templateUrl: '/views/provider-profile.html',
            controller: 'ProviderProfileCtrl',
            title: 'Service Provider Profile'
        })
        .when('/appointments-list', {
            templateUrl: '/views/appointments-list.html',
            controller: 'AppointmentsListCtrl',
            title: 'Appointments list'
        })
        .when('/about', {
            templateUrl: '/views/about.html',
            title: 'About'
        })
        .when('/privacy-policy', {
            templateUrl: '/views/terms-of-use.html',
            title: 'About'
        })
        .when('/subscription-packages', {
            templateUrl: '/views/subscription-packages.html',
            controller: 'SubscriptionPackagesCtrl',
            title: 'Subscription Packages'
        })
        .when('/healthcare-professionals', {
            templateUrl: '/views/healthcare-professionals.html',
            controller: 'HcpCtrl',
            title: 'Healthcare Professionals'
        })
        .when('/rate-appointments', {
            templateUrl: '/views/rate-appointments.html',
            controller: 'RateAppointmentCtrl',
            title: 'Rate Appointment'
        })
        .when('/subscriptions', {
            templateUrl: '/views/subscriptions.html',
            controller: 'SubscriptionsCtrl',
            title: 'Subscriptions'
        })
        .when('/unsubscribed', {
            templateUrl: '/views/unsubscribed.html',
            title: 'Unsubscribed'
        })
        .otherwise({
            redirectTo: '/'
        });


    $locationProvider.html5Mode({
        enabled: true
    });

    $httpProvider.interceptors.push('requestInterceptor');

    socialProvider.setGoogleKey(GOOGLE_PLUS_API_KEY);
    socialProvider.setLinkedInKey(FACEBOOK_APP_ID);

    angular.element(window.document).on('click','.navbar-collapse', function (e) {
        if (angular.element(e.target).is('a:not(".dropdown-toggle")')) {
            angular.element(this).collapse('hide');
        }
    });
}]).factory('requestInterceptor', ['$q', '$rootScope', function ($q, $rootScope) {
    $rootScope.pendingRequests = 0;

    $rootScope.$watch('overrideHideSpinner', function (overrideHideSpinner) {
        if (overrideHideSpinner === false) {
            maybeHideSpinner();
        }
    });

    return {
        request: function (config) {
            if (!/^\/longpoll/.test(config.url) && !/^\/map-autocomplete/.test(config.url)) {
                showSpinner();
                $rootScope.pendingRequests++;
            }

            if (!/^.*\.html$/.test(config.url)) {
                if (/^.*\?.*$/.test(config.url)) {
                    config.url = config.url + '&timestamp=' + Math.floor((Math.random() * 1e20));
                } else {
                    config.url = config.url + '?timestamp=' + Math.floor((Math.random() * 1e20));
                }
            }

            return config || $q.when(config);
        },
        requestError: function(rejection) {
            if ($rootScope.pendingRequests > 0) {
                $rootScope.pendingRequests--;
            }
            maybeHideSpinner();
            return $q.reject(rejection);
        },
        response: function(response) {
            if ($rootScope.pendingRequests > 0) {
                $rootScope.pendingRequests--;
            }
            maybeHideSpinner();
            return response || $q.when(response);
        },
        responseError: function(rejection) {
            if ($rootScope.pendingRequests > 0) {
                $rootScope.pendingRequests--;
            }
            maybeHideSpinner();
            return $q.reject(rejection);
        }
    };

    function showSpinner () {
        angular.element('body').removeClass('loaded');
    }

    function maybeHideSpinner () {
        if ($rootScope.pendingRequests === 0 && !$rootScope.overrideHideSpinner) {
            angular.element('body').addClass('loaded');
        }
    }
}])
.constant('TORONTO_COORDS', [43.653226, -79.3831843])
.constant('DURATIONS_CONSTANTS', [{
    mask: 1,
    time: -1,
    label: 'No duration'
}, {
    mask: 4,
    time: 30 * 60 * 1000,
    label: '30 mins'
}, {
    mask: 8,
    time: 45 * 60 * 1000,
    label: '45 mins'
}, {
    mask: 16,
    time: 60 * 60 * 1000,
    label: '60 mins'
}, {
    mask: 32,
    time: 90 * 60 * 1000,
    label: '90 mins'
}])
.constant('MORNING_START', 7 * 60 * 60 * 1000)
.constant('MORNING_END', 11 * 60 * 60 * 1000 + 45 * 60 * 1000)
.constant('AFTERNOON_START', 12 * 60 * 60 * 1000)
.constant('AFTERNOON_END', 16 * 60 * 60 * 1000 + 45 * 60 * 1000)
.constant('EVENING_START', 17 * 60 * 60 * 1000)
.constant('EVENING_END', 21 * 60 * 60 * 1000 + 45 * 60 * 1000)
.constant('DAY_END', 22 * 60 * 60 * 1000)
.constant('GOOGLE_PLUS_API_KEY', '934240198774-ttoafv0munmcnftu5frkjpcmhei2pook.apps.googleusercontent.com')
.constant('FACEBOOK_APP_ID', '2040333052874226');
