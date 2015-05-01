'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var cartModel = mongoose.model('Cart');
var lineItemModel = mongoose.model('LineItem');
var orderModel = mongoose.model('Order');

router.post('/', function (req, res, next) {
	var cartId = req.body.cartInfo._id;
	var sessionId = req.sessionID;

	// Function to generate a random confirmation number

	// It should create an order that includes the line items

	console.log("The cartId is ", cartId);

	cartModel.findOne({_id: cartId}).exec(function (err, currentCart) {
		if (err) throw err;

		console.log("The currentCart is ", currentCart);

		var order = new orderModel({
			sessionId: sessionId,
			status: "Active",
			user: "5541421a6c6c31d47876e032",
			datetime: new Date().getTime(),
			confirmationNumber: "12345678",
			lineItems: currentCart.lineItems,
		});

		console.log(order);

		order.save();
	});

	cartModel.findOne({sessionId: sessionId}).exec(function (err, cart) {
		console.log(cart);
		if(err) throw err;
		cart.closed = true;
		cart.save();
	});

	res.sendStatus(200);

	// It should generate a new session (in order to load a new cart)

});