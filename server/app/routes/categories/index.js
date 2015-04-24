// ******************************************
// internal API endpoint for categories
// *******************************************

var router = require('express').Router();
module.exports = router;

var path = require('path');
var categoryPath = path.join(__dirname, '../../../db/models/category');

var CategoriesModel = require(categoryPath);

router.get('/', function (req, res) {

	// console.log("SOMETHING");
	// console.log(CategoriesModel);

    /* 
    	working query params
		Failed params
    */

	/*	var searchParams = req.query.categories ? { categories: req.query.categories } : {};*/

    CategoriesModel.Category.find({}, function (err, categories) {
            if(err) throw err
            // console.log("FILMS-SERVER-Side",films);
            res.send(categories);
    });

});