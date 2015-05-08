var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var FilmsModel = mongoose.model('Film');

router.get('/', function (req, res) {
    
	var search = {};
	// search.regextitle = 'ar';
	search.regextitle = req.query.regextitle;
	console.log(search);

	FilmsModel.regexTitle(search.regextitle, function(err, films){
		if(err){console.log(err)}
		res.json(films);
	});

});