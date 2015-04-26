'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var cartModel = mongoose.model('Cart');

router.get('/', function (req, res) {
	var sessionId = req.sessionID;

	cartModel.findOne({sessionId: sessionId}).populate('films').exec(function (err, cart) {
		if(err) throw err;

		console.log(cart);

        res.send(cart);
	});

});

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
			cart = new cartModel({sessionId: sessionId});
			cart.films.push(filmId);
			return cart.save();
		}
	})
	.then(function (savedCart) {
	  	console.log('Cart model updated!');
	  	res.sendStatus(200);
	});

});