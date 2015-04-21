// ******************************************
// Need an 'internal API endpoint' for films
// *******************************************

var router = require('express').Router();
module.exports = router;


var FilmsModel = require('../../../db/models/film')

router.get('/films', function (req, res) {

	console.log("SOMETHING");
	console.log(FilmsModel);
    
    var modelParams = req.query.category ? { category: req.query.category } : {};

    FilmsModel.find({}, function (err, films) {
            if(err) throw err
            res.send(films);
    });

});