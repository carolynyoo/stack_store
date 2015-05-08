'use strict';
// Set up the state provider

app.config(function($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout',
        templateUrl: 'js/checkout/checkout.html',
        controller: 'CheckoutCtrl',
        resolve: {
            cartInfo: function(cartFactory) {
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

app.controller('CheckoutCtrl', function($scope, $http, cartInfo, $state) {


    function calculateTotal (allLineItemsInCart) {
        var total = 0;
        for (var i = 0; i < allLineItemsInCart.length; i++) {
            var currentItem = allLineItemsInCart[i];
            total += (currentItem.quantity * currentItem.film.price);
        }
        return total;
    }



    $scope.checkout = function() {
        $http.post('/api/checkout', {
            cartInfo: cartInfo, total: $scope.total
        }).
        success(function(confirmationNumber) {

            // Stripe Token Creation
            Stripe.card.createToken(

                {
                    name: $scope.billing.creditCardName,
                    number: $scope.billing.creditCardNumber,
                    cvc: $scope.billing.creditCardCVC,
                    exp_month: $scope.billing.creditExpiration.month,
                    exp_year: $scope.billing.creditExpiration.year,
                    name: $scope.billing.creditCardName,
                    address_line1: $scope.address.street,
                    //        address_line2: '',
                    address_city: $scope.address.city,
                    address_state: $scope.address.state,
                    address_zip: $scope.address.zip,
                    //        address_country: 'blah'
                }, stripeResponseHandler);


            console.log("Order created!");
            console.log("THE CONFIRMATION NUMBER ISSSSSS", confirmationNumber);
            $state.go('confirmation', {confirmationNumber: confirmationNumber});
        }).
        error(function(data) {
            console.log("Error creating order!");
        });
    };
    $scope.allLineItemsInCart = cartInfo.lineItems;
    $scope.total = calculateTotal($scope.allLineItemsInCart);

    $scope.billing = {};
    $scope.address = {};
    $scope.error = null;

    // Stripe Token Creation
    //Stripe.card.createToken($form, stripeResponseHandler);

    // Put this in a separate API for '/charge' and make that call when hitting submit as well or nest in post request?

    // TEST CARD for Stripe: 4012888888881881

    // Stripe Response Handler
    function stripeResponseHandler(status, response) {
        console.log("Got to Stripe Response Handler");
        //  	var $form = $('#checkout-form');

        if (response.error) {
            // Show the errors on the form
            // $form.find('.payment-errors').text(response.error.message);
            // $form.find('button').prop('disabled', false);
            console.log("This means the form probably had an error");
        } else {

            console.log("this is token:", response);
            // response contains id and card, which contains additional card details
            var token = response.id;

            console.log("Submitted the payment form");

            // Make server call to API/charge
            $http.post('/api/payment', {
                    stripeToken: token, total: $scope.total
                })
                .then(function(data) {
                    console.log("Payment Successful!");
                })
                .catch(function(data) {
                    console.log("Payment Error!");
                });
                


        }
    }

});