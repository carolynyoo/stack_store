'use strict';
var router = require('express').Router();
module.exports = router;

var async = require('async');

var mongoose = require('mongoose');

var cartModel = mongoose.model('Cart');
var lineItemModel = mongoose.model('LineItem');
var orderModel = mongoose.model('Order');
var filmModel = mongoose.model('Film');

router.post('/', function (req, res, next) {
	var cartId = req.body.cartInfo._id;
	var sessionId = req.sessionID;
	var userId = req.user._id;

	// Function to generate a random confirmation number

	// It should create an order that includes the line items

	cartModel.findOne({_id: cartId}).exec(function (err, currentCart) {
		if (err) throw err;

		// Generate random confirmationNumber for current Order

		var confirmationNumber = Math.random().toString(36).slice(2);

		var order = new orderModel({
			sessionId: sessionId,
			status: "Active",
			user: userId,
			datetime: new Date().getTime(),
			confirmationNumber: confirmationNumber,
			lineItems: currentCart.lineItems,
		});

		// It should update the inventory of each purchased film

		var updateFilms = function(lineItem, callback) {
			filmModel.findOne({_id: lineItem.film}).exec(function(err, currentFilm) {
				console.log("INVENTORY BEFORE WAS", currentFilm.inventory);
				currentFilm.inventory -= lineItem.quantity;
				return currentFilm.save();
			}).then(function (updatedCurrentFilm) {
				console.log("INVENTORY AFTER IS", updatedCurrentFilm.inventory);
				return callback(null);
			});
		};

		async.eachSeries(
			currentCart.lineItems,
			updateFilms,
			function(err) {
				console.log("INVENTORY UPDATED FOR ALL FILMS");
			}
		)

		order.save();

	});

	// It should update the status of the cart and save it.

	cartModel.findOne({sessionId: sessionId}).exec(function (err, cart) {
		// console.log(cart);

		if(err) throw err;
		cart.closed = true;
		cart.user = userId;
		cart.save();
	});


	// It should generate a new session (in order to load a new cart)

	// console.log("OLD SESSION ID", req.sessionID);

	//  Save the current session state before I regenerate the sessionID
    var temp = req.session.passport; // {user: 1}

    req.session.regenerate(function(err){
        //req.session.passport is now undefined, so let's reset it
        req.session.passport = temp;
		var newSessionId = req.sessionID;
		// console.log("NEW SESSION ID", req.sessionID);

        //Create the new cart
        var cart = new cartModel({
        	sessionId: newSessionId,
        	promoApplied: false,
        	user: userId
        });

        cart.save();

        req.session.save(function(err){
    		if(err) throw err;
			res.sendStatus(200);
        });
    });

});