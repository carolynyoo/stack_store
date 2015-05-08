var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var FilmsModel = mongoose.model('Film');

router.get('/', function (req, res) {
    
    
	FilmsModel.find({})
		.sort('-purchased')
		.limit(3)
		.populate('categories')
		.exec(function(err, films){
			if(err) throw err
			res.json(films);
		});

});