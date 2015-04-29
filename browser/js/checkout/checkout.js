'use strict';
// Set up the state provider

app.config(function ($stateProvider) {
	$stateProvider.state('checkout', {
		url: '/cart',
		templateUrl: 'js/checkout/checkout.html',
		controller: 'CheckoutCtrl'
	});
});

// Set up the Checkout controller

app.controller('CheckoutCtrl', function ($scope, $http) {

})