'use strict';
var path = require('path');
var router = require('express').Router();
module.exports = router;

var filmPath = path.join(__dirname, '../../../db/models/film');
var filmModel = require(filmPath);

router.get('/:pid', function (req, res) {
  var pid = req.params.pid; 
  filmModel.Film.find({"_id": pid}, function (err, film) {
    if (err) console.log(err);
    console.log(film);
    res.send(film);
  })
});