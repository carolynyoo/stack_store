'use strict';

// Set up the state provider
app.config(function ($stateProvider) {
	$stateProvider.state('orders', {
		url: '/orders',
		templateUrl: 'js/orders/orders.html',
		controller: 'OrdersCtrl',
		resolve: {
				orderInfo: function (ordersFactory, Session) {
				var userId = Session.user._id;
				return ordersFactory.getOrders(userId);
				}
		}
	})

});

// Set up the Order controller

app.controller('OrdersCtrl', function ($scope, $state, $http, $stateParams, orderInfo) {
    console.log("This is stateparams:", $stateParams);
	console.log("ORDER INFO IS", orderInfo);

	$scope.allOrdersForUser = orderInfo;
	$scope.hello = "IT WORKED";

	$scope.film = $stateParams.film;


//	Review film navigation
	$scope.writeReviewForFilm = function(lineItem){
		console.log(lineItem);
		var filmid = lineItem.film._id;
		$state.go('review', {id: filmid, film: lineItem.film});

										};

});

// Factory to retrieve an order from the database

app.factory('ordersFactory', function ($http) {
	return {
		getOrders: function(userId) {
						console.log("TRYING TO GET ORDERS WITH USERID: ", userId);
						return $http.get('/api/orders/'+userId).then(function (response) {
						return response.data;
																						});
									},
		getFilmName: function(lineItem){
						var filmid = lineItem.film._id;
						$http.get('/api/products/'+filmid).then(function (response) {
							console.log("this is response object");
							console.log(response.data);
						$scope.film = response.data;
							console.log("this is the scope object");
							console.log($scope);
							console.log("film.title");
							console.log($scope.film.title);
                		return response.data;
																					})
												}
		}
	}
});

// Filter for cents -> dollars

app.filter("centsToDollars", function() {
	return function (amountInCents) {
		return (amountInCents/100).toFixed(2);
	}
});
