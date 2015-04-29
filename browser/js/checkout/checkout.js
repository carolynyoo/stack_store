'use strict';
// Set up the state provider

app.config(function ($stateProvider) {
	$stateProvider.state('checkout', {
		url: '/cart',
		templateUrl: 'js/checkout/checkout.html',
		controller: 'CheckoutCtrl',
		// The following data.authenticate is read by an event listener
		// that controls access to this state. Refer to app.js.
		data: {
		    authenticate: true
		}
	});
});

// Set up the Checkout controller

app.controller('CheckoutCtrl', function ($scope, $http) {

})