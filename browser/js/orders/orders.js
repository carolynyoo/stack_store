'user strict';

// Set up the state provider
app.config(function ($stateProvider) {
	$stateProvider.state('orders', {
		url: '/orders',
		templateUrl: 'js/orders/orders.html',
		controller: 'OrdersCtrl'
	});
});

// Set up the Order controller

app.controller('OrdersCtrl', function ($scope, $http, ordersFactory) {

});

// Factory to retrieve an order from the database

app.factory('ordersFactory', function ($http) {
	return {
		getOrders: function() {
			return $http.get('/api/orders').then(function (response) {
				return response.data;
			});
		}
	}
});