'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');

// Import User model;
var User = mongoose.model('User');

router.post('/new-user', function(req, res) {
	console.log("The body is", req.body);
	var user = new User(req.body);
	console.log(user);
	user.save(function (err, data) {
		  if (err) return console.error(err);
		  res.sendStatus(200);
	});
});

router.use('/tutorial', require('./tutorial'));
router.use('/members', require('./members'));
router.use('/films', require('./films'));
router.use('/products', require('./pdp'));
router.use('/cart', require('./cart'));
router.use('/categories', require('./categories'));
router.use('/checkout', require('./checkout'));
router.use('/orders', require('./orders'));
router.use('/review', require('./reviews'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});
