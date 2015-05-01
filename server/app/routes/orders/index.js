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

	// IF defined as orderSchema.methods.getRanking...
	// (and not exported)
	// 'orderModel' is a constructor 
	// **Really should be OrderModel... 
	// SO, doesn't have the instance method you created...
	// When you run the constructor and get the instance returned, then you get the instance and your method

	/* orderModel.findOne({}, function (err, orderObj) {
        // Constructor gets the mongoose prototype methods... findOne 
        
        console.log(orderObj);
        // what's returned looks like a record from the db... 

        // !! BUT... mongoose is hiding things 
        for (var keys in orderObj){
        	console.log(keys)
        }
        // Looks like an obj from your db... but really its a mongoose object!!

        if(err) throw err
        orderObj.getRanking(function(err, orders){
            res.json(orders);
        });
    	// that mongoose instance object has the method we want to use. 
    }); */

	// Mongoose 'Statics' get placed on the Constructor from mongoose.model
 	// For whatever reason...  
	orderModel.getRanking(function (err, orders) {
            if(err) throw err
            // console.log("FILMS-SERVER-Side",films);
            res.json(orders);
    });

})
