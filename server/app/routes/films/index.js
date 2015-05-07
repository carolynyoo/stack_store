
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

	var purchasestats = req.body.purchasestats;
	
	for(var movie in purchasestats){
	
		FilmsModel.update({ _id: purchasestats[movie]._id}, { $inc: { purchased: purchasestats[movie].count }})
			.exec(function(err, results){
				if(err){console.log(err)}
				// console.log(results)
			});
	}
	
});
