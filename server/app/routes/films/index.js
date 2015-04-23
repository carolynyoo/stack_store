// ******************************************
// Need an 'internal API endpoint' for films
// *******************************************

var router = require('express').Router();
module.exports = router;

var path = require('path');
var filmPath = path.join(__dirname, '../../../db/models/film');

var FilmsModel = require(filmPath);

router.get('/', function (req, res) {

	// console.log("SOMETHING");
	// console.log(FilmsModel);

    /* 
    	working query params
		{ title: "The Matrix" }
		{ categories: "5532c18a0dad5827ab24af49" }
		
		Failed params
		{ categories: "Action" }
    */
    
    // var searchParams = req.query.title ? { title: req.query.title } : {};
	// http://127.0.0.1:4567/api/films?title=The+Matrix

	var searchParams = req.query.categories ? { categories: req.query.categories } : {};

    FilmsModel.Film.find(searchParams, function (err, films) {
            if(err) throw err
            // console.log("FILMS-SERVER-Side",films);
            res.send(films);
    });

});