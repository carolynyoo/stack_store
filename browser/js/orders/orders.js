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
	});
});

// Set up the Order controller

app.controller('OrdersCtrl', function ($scope, $http, orderInfo) {

	console.log("ORDER INFO IS", orderInfo);

	$scope.allOrdersForUser = orderInfo;

});

// Factory to retrieve an order from the database

app.factory('ordersFactory', function ($http) {
	return {
		getOrders: function(userId) {
			console.log("TRYING TO GET ORDERS WITH USERID: ", userId);
			return $http.get('/api/orders/'+userId).then(function (response) {
				return response.data;
			});
		}
	}
});