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

		if (cart) {
			lineItemModel.populate(cart.lineItems, opts, function(err, populatedLineItem) {
				if(err) throw err;
				res.send(cart);
			});
		} else {
			console.log("NO CART FOUND!");
			throw err;
		}

	});

});

//UPDATE QUANTITY OF CART ITEM

router.put('/updateQuantity', function (req, res) {
	var lineItemIndex = req.body.index;
	var lineItemUpdatedQuantity = req.body.updatedQuantity;
	var sessionId = req.sessionID;
	
	cartModel.findOne({sessionId: sessionId}).exec(function (err, cart) {
		if(err) throw err;
		cart.lineItems[lineItemIndex].quantity = lineItemUpdatedQuantity;
		cart.save();
		res.send(cart);
	});
});

//REMOVE ITEM FROM CART

router.put('/removeItem', function (req, res) {
	var sessionId = req.sessionID;
	var filmId = req.body.filmId;

	var opts = {
	            path: 'film',
	        };

	cartModel.findOne({sessionId: sessionId}).exec(function (err, cart) {
		if(err) throw err;

		// Determine if a line item for the film already exists

		var lineItemIndex;

		function returnIndexOfLineItemForFilm(lineItems) {
			for (var i = 0; i < lineItems.length; i++) {
				if (lineItems[i].film == filmId) {
					lineItemIndex = i;
					return true;
				} else {
					console.log("Film not found")
				}
			}
		};

		returnIndexOfLineItemForFilm(cart.lineItems);

		cart.lineItems.splice(lineItemIndex, 1);

		return cart.save();
	}).then(function(savedCart) {
		console.log('Item removed from cart!');
			lineItemModel.populate(savedCart.lineItems, opts, function(err, populatedLineItem) {
				if(err) throw err;
				res.send(savedCart);
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

			console.log("Cart already exists!");

			// If film already exists in a line order, just increase the quantity

			// Function to check if film already exists in Cart

			console.log("Film ID is ", filmId);

			var lineItemIndex;

			function filmAlreadyExistsInCart(lineItems) {
				for (var i = 0; i < lineItems.length; i++) {
					if (lineItems[i].film == filmId) {
						lineItemIndex = i;
						return true;
					};
				}

				return false;
			}

			if (filmAlreadyExistsInCart(cart.lineItems)) {

				cart.lineItems[lineItemIndex].quantity += 1;

				console.log("Cart exists, quantity of film increased!");

			} else {

				// Else, create a new line order with a quantity of 1

				cart.lineItems.push({
					film: filmId,
					quantity: 1
				});
			
				console.log("Cart exists, created a new line order with a quantity of 1");

			}

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