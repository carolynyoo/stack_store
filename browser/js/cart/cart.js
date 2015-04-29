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

app.controller('CartCtrl', function ($scope, $http, cartInfo, cartFactory) {

	$scope.allFilmsInCart = cartInfo.films;

	// Function to delete an item from the cart

	$scope.removeFilmFromCart = function (film) {
		var filmId = film._id;
		$http.put('/api/cart', {filmId: filmId}).
		    success(function(cartInfo) {
		    	$scope.allFilmsInCart = cartInfo.films;
		        console.log("Item removed from Cart!");
		    }).
		    error(function(data) {
		        console.log("Error removing item from Cart!");
		    });
	}

});

// Factory to get a cart

app.factory('cartFactory', function ($http) {
	return {
		getCart: function() {
			return $http.get('/api/cart').then(function (response) {
			    return response.data;
			});
		}
	};
});

// Filter for cents -> dollars

app.filter("centsToDollars", function() {
	return function (amountInCents) {
		return (amountInCents/100).toFixed(2);
	}
})