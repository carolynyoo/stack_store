'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var orderModel = mongoose.model('Order');

router.get('/:userId', function(req, res) {
	// Query to find order goes here

	var userId = req.params.userId;

	orderModel.find({user: userId}).exec(function (err, orders) {
		if (err) throw err;

		console.log("FOUND ORDERS ARE: ", orders);

		res.send(orders);
	})

})