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
