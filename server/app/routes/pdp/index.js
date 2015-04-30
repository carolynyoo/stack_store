'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var filmModel = mongoose.model('Film');
var reviewModel = mongoose.model('Review');

router.get('/:pid', function (req, res, next) {
  var pid = req.params.pid; 
  filmModel.findOne({_id: pid})
  .populate('categories')
  .exec(function(err, film){
      if (err) return next(err); 

  //    res.json(film);
  
  reviewModel.find({film: pid}).exec(function (err, reviews) {
    if (err) return next(err);
    console.log(reviews);
    var filmObj = film.toObject();
    filmObj.reviews = reviews;
    res.json(filmObj);
  });


  }
      );

  


  });
