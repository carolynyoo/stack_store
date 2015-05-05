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

router.put('/:pid', function (req, res, next) {
  var pid = req.params.pid;
  var updatedFilm = {
      title: req.body.title, 
      description: req.body.description,
      price: req.body.price,
      inventory: req.body.inventory,
      photo: req.body.photo
  }
  return filmModel.findByIdAndUpdate(pid, {$set: updatedFilm}, function (err) {
      if (err) {
        return res.status(500);
      }
      return res.send('Success in updating');
    })
});

router.post('/', function (req, res, next) {
  var newFilm = new filmModel({
    title: req.body.title, 
    description: req.body.description,
    price: req.body.price,
    inventory: req.body.inventory,
    photo: req.body.photo
  })

  newFilm.save(function (err) {
    if (err) {
      return next(err);
    }
    return res.send('Success in creating');
  })
});