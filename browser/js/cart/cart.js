'use strict';
// Set up the state provider
app.config(function ($stateProvider) {
	$stateProvider.state('cart', {
   		url: '/cart',
   		templateUrl: 'js/cart/cart.html',
   		controller: 'CartCtrl',
   		resolve: {
   			cartInfo: function (cartFactory) {
   				return cartFactory.getCart();
   			}
   		}
   });
});

// Set up the Cart Controller

app.controller('CartCtrl', function ($scope, cartInfo) {

	$scope.allFilmsInCart = cartInfo.films;

});

app.factory('cartFactory', function ($http) {
	return {
		getCart: function() {
			return $http.get('/api/cart').then(function (response) {
			    return response.data;
			});
		}
	};
});