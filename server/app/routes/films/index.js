// ******************************************
// Need an 'internal API endpoint' for films
// *******************************************

var router = require('express').Router();
module.exports = router;

var path = require('path');
var filmPath = path.join(__dirname, '../../../db/models/film');

var FilmsModel = require(filmPath);

router.get('/', function (req, res) {

	console.log("SOMETHING");
	console.log(FilmsModel);
    
    var modelParams = req.query.category ? { category: req.query.category } : {};

    FilmsModel.Film.find({}, function (err, films) {
            if(err) throw err
            res.send(films);
    });

});