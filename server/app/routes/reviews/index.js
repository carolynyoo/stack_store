'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var reviewModel = mongoose.model('Review');

router.get('/:pid', function (req, res, next) {
  var pid = req.params.pid; 
  reviewModel.findById(pid, function (err, reviews) {
    if (err) next(err);
    console.log(reviews);
    res.json(reviews);
  });
});
