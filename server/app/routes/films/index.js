// ******************************************
// Need an 'internal API endpoint' for films
// *******************************************

var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var FilmsModel = mongoose.model('Film');

router.get('/', function (req, res) {

	FilmsModel.find()
		.populate('categories')
		.exec(function(err, films){
			if(err) throw err
			res.json(films);
		});
});