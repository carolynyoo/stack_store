
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


router.put('/', function (req, res) {

	console.log("HIT THE FILM PUT ROUTE");
	// console.log("req.body: ", req.body);
	// console.log("req.body.stats: ", req.body.stats);
	// var purchasestats = req.body.stats;
	// console.log(typeof purchasestats);		
	// console.log("purchasestats: ",purchasestats);

	for(var movie in req.body){
	
		FilmsModel.update({ _id: req.body[movie]._id}, { $inc: { purchased: req.body[movie].count}})
			.exec(function(err, results){
				if(err){console.log(err)}
				console.log(results)
			});
	}
	
});

// , inventory: -purchasestats[movie].count }
