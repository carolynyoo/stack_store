var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var FilmsModel = mongoose.model('Film');

router.get('/', function (req, res) {

	FilmsModel.getTop(function(err, films){
		if(err){console.log(err)}
		res.json(films);
	})

/*	
FilmsModel.find({})
	.sort('-purchased')
	.limit(4)
	.populate('categories')
	.exec(function(err, films){
		if(err) throw err
		res.json(films);
	});
*/

});