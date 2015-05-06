'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var reviewModel = mongoose.model('Review');

router.get('/:pid', function (req, res, next) {
  var pid = req.params.pid; 
  reviewModel.findOne({film: ObjectId(pid)}).populate('comment').exec(function (err, review) {
    if (err) next(err);
    console.log(review);
    res.json(review);
  });
});

router.post('/', function (req, res, next) {

//	var filmid = req.body.film._id;
//  user from signed in user

	var rating = parseInt(req.body.rating);

	console.log("got to post code");

	console.log("this is userid", req.body.user);
	console.log("this is comment", req.body.comment);
	console.log("this is rating", rating);
	console.log("this is type of rating", typeof rating);
	console.log("this is filmid", req.body.film);


	// var userId = req.body.user;
	// var comment = req.body.comment;
	// var rating = req.body.rating;
	// var filmId = req.body.film;

//	if (err) next(err);
    
		var review = new reviewModel({
			user: req.body.user,
			date: new Date().getTime(),
			comment: req.body.comment,
			rating: req.body.rating,
			film: req.body.film
		});

	console.log("this is before review save");
		review.save();
	console.log("this is supposedly after review.save()");
		res.sendStatus(204);

});
