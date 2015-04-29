'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var orderModel = mongoose.model('Order');
var lineItemModel = mongoose.model('LineItem');

router.get('/:userId', function(req, res) {
	// Query to find order goes here

	var userId = req.params.userId;

	var opts = {
	            path: 'film',
	        };

	orderModel.find({user: userId}).exec(function (err, orders) {
		if (err) throw err;

		for (var i=0; i < orders.length; i++) {
			lineItemModel.populate(orders[i].lineItems, opts, function(err, populatedLineItem) {
				if (err) throw err;
			}).then(function(populatedOrders) {
				console.log("POPULATED ORDERS ARE: ", orders);
				res.send(orders);
			});
		}
	});

});