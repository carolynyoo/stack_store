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

	/*FilmsModel.find(searchParams, function (err, films) {
            if(err) throw err
            res.send(films);
    });*/

});


router.put('/', function (req, res, next) {
	
	console.log("HIT THE FILM PUT ROUTE");
	var purchasestats = req.body.purchasestats;
	console.log("purchasestats: ",purchasestats);

	

});