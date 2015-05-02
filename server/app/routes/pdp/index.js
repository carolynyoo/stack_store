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
    reviewModel.find({film: pid}).exec(function (err, reviews) {
      if (err) return next(err);
      console.log(reviews);
      var filmObj = film.toObject();
      filmObj.reviews = reviews;
      res.json(filmObj);
    });
  });
});

router.delete('/:pid', function (req, res, next) {
  var pid = req.params.pid;
  return filmModel.findById(pid, function (err, film) {
    return film.remove(function (err) {
      if (err) {
        return next(err);
      }
      return res.send('Success in deletion');
    })
  })
});

router.put('/', function (req, res, next) {
  var pid = req.body._id;
  return filmModel.findById(pid, function (err, film) {
    if (err) {
      return next(err);
    }
    if (!film) {
      return res.send(404);
    }
    var updatedFilm = {
      title: req.body.title, 
      description: req.body.description,
      inventory: req.body.inventory,
      photo: req.body.photo
    }
    filmModel.updateById(pid, updatedFilm, function (err) {
      if (err) {
        return res.send(500, err);
      }
      return res.send('Success in updating');
    })
  })
})