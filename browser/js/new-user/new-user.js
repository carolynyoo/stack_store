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
    		success(function() {
    			console.log("New user successfully registered!");
    		}).
    		error(function() {
    			console.log("Some error occurred during account registration.");
    		});
    };

});