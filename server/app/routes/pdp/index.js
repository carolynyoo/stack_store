'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var filmModel = mongoose.model('Film');

router.get('/:pid', function (req, res, next) {
  var pid = req.params.pid; 
  filmModel.findOne({_id: pid})
  .populate('categories')
  .exec(function(err, film){
      if (err) console.log(err)
      res.json(film);
  }
      );
  });
