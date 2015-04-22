'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');

// Import User model;
var User = mongoose.model('User');

router.post('/new-user', function(req, res) {
	var user = new User(req.body);
	user.save(function (err, data) {
		  if (err) return console.error(err);
	});
});

router.use('/tutorial', require('./tutorial'));
router.use('/members', require('./members'));
router.use('/products', require('./pdp'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});