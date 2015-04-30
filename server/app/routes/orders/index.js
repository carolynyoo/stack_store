// ******************************************
// internal API endpoint for categories
// *******************************************

var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var orderModel = mongoose.model('Order');

router.get('/', function(req, res) {
	orderModel.find({}, function (err, orders) {
            if(err) throw err
            // console.log("FILMS-SERVER-Side",films);
            res.json(orders);
    });
})