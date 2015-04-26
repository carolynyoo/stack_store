app.config(function ($stateProvider) {
	
	$stateProvider.state('new-user', {
		url: '/new-user',
		templateUrl: 'js/new-user/new-user.html',
		controller: 'NewUserCtrl'
	});
});

app.controller('NewUserCtrl', function ($scope, AuthService, $state, $http) {

    $scope.error = null;
    $scope.newAccount = {};

    $scope.createAccount = function (newAccount) {

    	$scope.error = null;

    	$http.post('/api/new-user', newAccount).
    		success(function(data) {
    			console.log("New user successfully registered!");

                //Automatically log in after creating a new account

                AuthService.login({email: newAccount.email, password: newAccount.password}).then(function () {
                    $state.go('home');
                }).catch(function () {
                    $scope.error = 'Invalid login credentials.';
                });
    		}).
    		error(function(data) {
    			console.log("Some error occurred during account registration.");
    		});
    }

});