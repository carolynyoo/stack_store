
var async = require('async');
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

	var putLoop = function (reqbody){
		FilmsModel.update({ _id: reqbody[movie]._id}, { $inc: { purchased: reqbody[movie].count}})
			.exec(function(err, results){
				if(err){console.log(err)}
				console.log(results)
		});
	}

	async.eachSeries(
			req.body,
			putLoop,
			function(err) {
				console.log("stats updated");
				res.status(200).end();
			}
	)

});

// , inventory: -purchasestats[movie].count }
