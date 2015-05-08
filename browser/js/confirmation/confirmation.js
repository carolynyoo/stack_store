'use strict';
// Set up the state provider

app.config(function ($stateProvider) {
	$stateProvider.state('confirmation', {
		url: '/confirmation/:confirmationNumber',
		templateUrl: 'js/confirmation/confirmation.html',
		controller: 'ConfirmationCtrl',
		// The following data.authenticate is read by an event listener
		// that controls access to this state. Refer to app.js.
		data: {
		    authenticate: true
		},
		resolve: {

		}
	});
});

// Set up the Checkout controller

app.controller('ConfirmationCtrl', function ($scope, $http, $stateParams) {
	$scope.confirmationNumber = $stateParams.confirmationNumber;
	console.log($stateParams.confirmationNumber);
});