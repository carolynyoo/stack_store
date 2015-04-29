'use strict';
// Set up the state provider

app.config(function ($stateProvider) {
	$stateProvider.state('confirmation', {
		url: '/confirmation',
		templateUrl: 'js/confirmation/confirmation.html',
		controller: 'ConfirmationCtrl'
	});
});

// Set up the Checkout controller

app.controller('ConfirmationCtrl', function ($scope, $http) {

})