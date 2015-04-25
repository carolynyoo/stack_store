'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var cartModel = mongoose.model('Cart');

router.post('/', function (req, res, next) {
	var filmId = req.body.filmId;
	var sessionId = req.sessionID;

	//Check if cart already exists, if it doesn't create a new cart
	// function findCartBasedOnSessionId (sessionId) {
	// 	cartModel.find({sessionId: sessionId}, function(err, existingCart) {
	// 		if (err) {return console.err(err)};
	// 		// console.log('Finding cart');
	// 		console.log(existingCart[0]);
	// 		return existingCart[0];
	// 	})
	// 	return existingCart[0];
	// }
	cartModel.findOne({sessionId: sessionId}).exec()
	.then(function (cart) {
		console.log(cart);
		if (cart) {
			cart.films.push(filmId);
			return cart.save();
		} else {
			cart = new cartModel({sessionId: sessionId})
			cart.films.push(filmId);
			return cart.save();
		}
	})
	.then(function (savedCart) {
	  	console.log('Cart model updated!')
	  	res.sendStatus(200);
	});

	// findCartBasedOnSessionId(sessionId);

	// console.log(findCartBasedOnSessionId(sessionId));

	// console.log(newCart);

	// if (findCartBasedOnSessionId(sessionId) == undefined) {
	// 	cart = new cartModel({sessionId: sessionID});
	// } else {
	// 	cart = findCartBasedOnSessionId(sessionId);
	// }

	// cart.films.push(filmId);

	//But if it does, simply update the array of films

	//Save the cart
	// cart.save(function (err) {
	//   if (err) return handleError(err);
	//   console.log('Cart model updated!')
	// });
})