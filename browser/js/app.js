'use strict';
var app = angular.module('BadAssMovies', ['ui.router', 'fsaPreBuilt', 'payment', 'angularMoment']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function (state) {
        return state.data && state.data.authenticate;
    };

    // The given state requires an authenticated admin user.
    var destinationStateRequiresAdmin = function (state) {
        return state.data && state.data.admin;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {

        // log changes in state
        $rootScope.previousState = fromState.name;
        $rootScope.currentState = toState.name;
        // console.log('Previous state:'+$rootScope.previousState);
        // console.log('Current state:'+$rootScope.currentState);

        if (!destinationStateRequiresAuth(toState) && !destinationStateRequiresAdmin(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                if (destinationStateRequiresAdmin(toState)) {
                    if (user.admin) {
                        $state.go('admin');
                    }
                } else {
                    if (destinationStateRequiresAuth(toState)) {
                        $state.go(toState.name, toParams);
                    }
                }
            } else {
                $state.go('login');
            }
        }).catch(function () {
            $state.go('login');
        });

    });

});