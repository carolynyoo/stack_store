'use strict';

// Set up the state provider
app.config(function ($stateProvider) {
	$stateProvider.state('cart', {
   		url: '/cart',
   		templateUrl: 'js/cart/cart.html',
   		controller: 'CartCtrl'
   })
});

// Set up the Cart Controller

app.controller('CartCtrl', function ($scope, $state) {

});