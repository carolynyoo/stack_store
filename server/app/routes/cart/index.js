'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var cartModel = mongoose.model('Cart');

//GET CART

router.get('/', function (req, res) {
	var sessionId = req.sessionID;

	cartModel.findOne({sessionId: sessionId}).populate('films').exec(function (err, cart) {
		if(err) throw err;

		console.log(cart);

        res.send(cart);
	});

});

//REMOVE ITEM FROM CART

router.put('/', function (req, res) {
	var sessionId = req.sessionID;
	var filmId = req.body.filmId;

	cartModel.findOne({sessionId: sessionId}).exec(function (err, cart) {
		if(err) throw err;
		var index = cart.films.indexOf(filmId);

		if (index > -1) {
			cart.films.splice(index, 1);
		}
		return cart.save();
	}).then(function(savedCart) {
		console.log('Item removed from cart!');
		res.send(savedCart);
	});
});

//ADD ITEM TO CART

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