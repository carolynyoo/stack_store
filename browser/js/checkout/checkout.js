'use strict';
// Set up the state provider

app.config(function ($stateProvider) {
	$stateProvider.state('checkout', {
		url: '/checkout',
		templateUrl: 'js/checkout/checkout.html',
		controller: 'CheckoutCtrl',
		resolve: {
			cartInfo: function (cartFactory) {
				return cartFactory.getCart();
			}
		},
		// The following data.authenticate is read by an event listener
		// that controls access to this state. Refer to app.js.
		data: {
		    authenticate: true
		}
	});
});

// Set up the Checkout controller

app.controller('CheckoutCtrl', function ($scope, $http, cartInfo, $state) {

	var purchasestats = {}

	var purchases = cartInfo.lineItems; 
	var l = purchases.length;

	for(var i=0; i<l; i++){
		var filmstat = {}
		filmstat.count = purchases[i].quantity
		var movie = purchases[i].film
		purchasestats[movie] = filmstat.count
	}

	console.log("purchasestats: ",purchasestats);

	$scope.checkout = function () {
		$http.post('/api/checkout', {cartInfo: cartInfo}).
		then(function(postreturn){
			$http.put('/api/films', {purchasestats: purchasestats})	
		}, function(err){
			consol.log(err);
		}).
			success(function(data) {
			    console.log("Order created!");
			    $state.go('confirmation');
			}).
			error(function(data) {
			    console.log("Error creating order!");
			});
	};
	$scope.allLineItemsInCart = cartInfo.lineItems;
	$scope.billing = {};
	$scope.address = {};
	$scope.error = null;

	// Stripe Token Creation
	//Stripe.card.createToken($form, stripeResponseHandler);

/*
	Stripe.card.createToken(

		{
		number: $scope.billing.creditCardNumber,
  		cvc: $scope.billing.creditCardCVC,
        exp_month: $scope.billing.creditExpiration.month,
        exp_year: $scope.billing.creditExpiration.year,
        name: $scope.billing.creditCardName,
        address_line1: 'blah',
        address_line2: 'blah',
        address_city: 'blah',
        address_state: 'blah',
        address_zip: 'blah',
        address_country: 'blah'
		}

		, stripeResponseHandler);

*/

/*
// Stripe Response Handler
//	function stripeResponseHandler(status, response) {
  	var $form = $('#payment-form');

    if (response.error) {
    // Show the errors on the form
    $form.find('.payment-errors').text(response.error.message);
    $form.find('button').prop('disabled', false);
  	} else {
    // response contains id and card, which contains additional card details
    var token = response.id;
    // Insert the token into the form so it gets submitted to the server
    $form.append($('<input type="hidden" name="stripeToken" />').val(token));
    // and submit
    $form.get(0).submit();
  }
}

*/
//


});