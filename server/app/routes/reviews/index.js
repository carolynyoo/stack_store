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

	var rating = parseInt(req.body.rating);
    
		var review = new reviewModel({
			user: req.body.user,
			date: new Date().getTime(),
			comment: req.body.comment,
			rating: req.body.rating,
			film: req.body.film
		});

		review.save();

		res.sendStatus(204);

});
