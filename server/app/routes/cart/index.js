'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var cartModel = mongoose.model('Cart');
var lineItemModel = mongoose.model('LineItem')

//GET CART

router.get('/', function (req, res) {
	var sessionId = req.sessionID;

	var opts = {
	            path: 'film',
	        };

	cartModel.findOne({sessionId: sessionId}).exec(function (err, cart) {
		if(err) throw err;

		console.log("Cart before population", cart);

		lineItemModel.populate(cart.lineItems, opts, function(err, populatedLineItem) {
			if(err) throw err;
			console.log("Populated Line Item", populatedLineItem);
			console.log("Cart after population", cart);
			res.send(cart);
		}) 

	});

});

//REMOVE ITEM FROM CART

router.put('/', function (req, res) {
	var sessionId = req.sessionID;
	var filmId = req.body.filmId;

	cartModel.findOne({sessionId: sessionId}).exec(function (err, cart) {
		if(err) throw err;

		// Determine if a line order for the film already exists

		// carts.lineItems.forEach(function searchFor)

		var index = cart.films.indexOf(filmId);

		if (index > -1) {
			cart.films.splice(index, 1);
		}

		return cart.save();
	}).then(function(savedCart) {
		console.log('Item removed from cart!');
		savedCart.populate('films', function (err, populatedCart) {
			if (err) throw err;
			res.send(populatedCart);
		});
	});
});

//ADD ITEM TO CART

router.post('/', function (req, res, next) {
	var filmId = req.body.filmId;
	var sessionId = req.sessionID;

	cartModel.findOne({sessionId: sessionId}).exec()
	.then(function (cart) {
		console.log(cart);

		// Check if cart exists

		if (cart) {

			// If film already exists in a line order, just increase the quantity

			// Function to check if film already exists in Cart

			function filmAlreadyExistsInCart(lineItems) {
				for (var i = 0; i < lineItems.length; i++) {
					if (lineItems[i].film.indexOf(filmId) > -1) return i;
				}

				return false;
			}

			if (filmAlreadyExistsInCart(cart.lineItems)) {

				cart.lineItems[i].quantity += 1;

				console.log("Cart exists, quantity of film increased!");

			} else {

				// Else, create a new line order with a quantity of 1

				cart.lineItems.push({
					film: filmId,
					quantity: 1
				});
				
			}

				console.log("Cart exists, created a new line order with a quantity of 1");

			return cart.save();


		// If cart doesn't exist, create it and cart add the film to a line order

		} else {

			cart = new cartModel({
				sessionId: sessionId,
				promoApplied: false
			});

			console.log("Newly created Cart is", cart);

			cart.lineItems.push({
				film: filmId,
				quantity: 1
			});

			console.log("Cart doesn't exist, created a new line order with a quantity of 1");

			return cart.save();
		}
	})
	.then(function (savedCart) {
	  	console.log('Cart model updated!', savedCart);
	  	res.sendStatus(200);
	});

});