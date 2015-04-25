'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var cartModel = mongoose.model('Cart');

router.post('/', function (req, res, next) {
	var filmId = req.body.filmId;
	var sessionId = req.sessionID;

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

})