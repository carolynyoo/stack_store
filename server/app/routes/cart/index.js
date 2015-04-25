'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var cartModel = mongoose.model('Cart');

router.post('/', function (req, res, next) {
	var filmId = req.body.filmId;
	console.log(filmId);
	var cart = new cartModel({sessionId: 'waitingforcookiestobemerged'});
	cart.films.push(filmId);
	cart.save(function (err) {
	  if (err) return handleError(err);
	  console.log('Cart model updated!')
	});
})