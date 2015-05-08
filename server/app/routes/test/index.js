var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var FilmsModel = mongoose.model('Film');

router.get('/', function (req, res) {
    
	FilmsModel.find({title: {$regex: 'ar'}})
		.sort('-purchased')
		.populate('categories')
		.exec(function(err, films){
			if(err) throw err
			res.json(films);
		});

});