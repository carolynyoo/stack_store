'use strict';
var path = require('path');
var router = require('express').Router();
module.exports = router;

var filmModel = mongoose.model('Film');

router.get('/:pid', function (req, res, next) {
  var pid = req.params.pid; 
  filmModel.findById(pid, function (err, film) {
    if (err) next(err);
    console.log(film);
    res.json(film);
  })
});