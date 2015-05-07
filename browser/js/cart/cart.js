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

	$scope.allLineItemsInCart = cartInfo.lineItems;

	// Function to delete an item from the cart

	$scope.removeFilmFromCart = function (film) {
		var filmId = film._id;
		$http.put('/api/cart', {filmId: filmId}).
		    success(function(cartInfo) {
		    	$scope.allLineItemsInCart = cartInfo.lineItems;
		        console.log("Item removed from Cart!");
		    }).
		    error(function(data) {
		        console.log("Error removing item from Cart!");
		    });
	}

});

// Factory to get a cart

app.factory('cartFactory', function ($http, $state, $stateParams) {
	return {
		getCart: function() {
			return $http.get('/api/cart').then(function (response) {
				console.log("The data is", response.data);
			    return response.data;
			});
		},
    addToCart: function (pid) {
      var id = pid || $stateParams.pid; 
      $http.post('/api/cart', {filmId: id}).
      success(function() {
          console.log("Item added to cart!");
          $state.go('cart');
      }).
      error(function() {
          console.log("Error adding item to cart");
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