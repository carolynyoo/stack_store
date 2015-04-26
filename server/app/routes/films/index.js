// ******************************************
// Need an 'internal API endpoint' for films
// *******************************************

var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var FilmsModel = mongoose.model('Film');

router.get('/', function (req, res) {
    
    var modelParams = req.query.category ? { category: req.query.category } : {};

    FilmsModel.find({}, function (err, films) {
            if(err) throw err;
            res.send(films);
    });

});