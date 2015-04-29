app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });

});

app.controller('LoginCtrl', function ($scope, AuthService, $state, $rootScope) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        console.log('BAH',$rootScope.previousState)

        AuthService.login(loginInfo).then(function () {
            $state.go($rootScope.previousState);
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });

    };

});