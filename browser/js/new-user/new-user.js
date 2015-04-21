app.config(function ($stateProvider) {
	
	$stateProvider.state('new-user', {
		url: '/new-user',
		templateUrl: 'js/new-user/new-user.html',
		controller: 'NewUserCtrl'
	});
});

app.controller('NewUserCtrl', function ($scope, AuthService, $state) {

    $scope.error = null;
    $scope.newLogin = {};

});