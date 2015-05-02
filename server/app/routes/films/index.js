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


router.put('/', function (req, res) {
	
	console.log("HIT THE FILM PUT ROUTE");
	var purchasestats = req.body.purchasestats;
	// var movie = req.body.purchasestats[0].movie;
	// console.log("movie: ",movie);
	// var stats = JSON.parse(purchasestats)
	// console.log("purchasestats: ",stats);
	console.log("purchasestats: ",purchasestats);
	
	for(movie in purchasestats){
		console.log(movie._id);
		console.log(movie.count);
		FilmsModel.find({ _id: movie._id})
			.exec(function(err, films){
				if(err) throw err
				console.log(films);
			});
	}
	
});