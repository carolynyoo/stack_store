// ******************************************
// Need an 'internal API endpoint' for films
// *******************************************

var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var FilmsModel = mongoose.model('Film');

router.get('/', function (req, res) {
    
    var searchParams = req.query.categories ? { categories: req.query.categories } : {};

  FilmsModel.find(searchParams)
    .populate('categories')
    .exec(function(err, films){
      if(err) throw err
      res.json(films);
    });

});