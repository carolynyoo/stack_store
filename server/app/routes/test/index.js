var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var FilmsModel = mongoose.model('Film');

router.get('/', function (req, res) {
    
	var search = {};
	search.regextitle = 'ar';
	console.log(search);

	// FilmsModel.find({title: /search.string/i })
	// 	.sort('-purchased')
	// 	.populate('categories')
	// 	.exec(function(err, films){
	// 		if(err) throw err
	// 		res.json(films);
	// 	});

	FilmsModel.regexTitle(search.regextitle, function(err, films){
		if(err){console.log(err)}
		res.json(films);
	});

});