'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
var async = require('async');
module.exports = router;

var orderModel = mongoose.model('Order');
var lineItemModel = mongoose.model('LineItem');

router.get('/:userId', function(req, res) {
	// Query to find order goes here

	var userId = req.params.userId;


	orderModel.find({user: userId}).exec(function (err, orders) {
		
		var opts = {
		            path: 'film',
		        };

		if (err) throw err;

		var populateOrders = function(order, callback) {
			lineItemModel.populate(order.lineItems, opts, 
				function(err, populatedLineItem) {
						if (err) throw err;
						return callback(null);
				});
		};

		//Use async since .populate is asynchronous

		async.eachSeries(
			orders, 
			populateOrders,
			function(err) {
				console.log("SENDING ORDERS", orders);
				res.send(orders);
			}
		);
	});

});


router.get('/', function(req, res) {
	orderModel.find({}, function (err, orders) {
            if(err) throw err
            // console.log("FILMS-SERVER-Side",films);
            res.json(orders);
    });
})
