'use strict';
var VIDEOS = require('./videos.json');

var router = require('express').Router();
module.exports = router;

router.get('/videos', function (req, res) {
    res.send(VIDEOS);
});


// ******************************************
// Need an 'internal API endpoint' for films
// *******************************************

var FilmsModel = require('./models/flash-card-model')

router.get('/films', function (req, res) {
    
    var modelParams = req.query.category ? { category: req.query.category } : {};

    FlashCardModel.find(modelParams, function (err, cards) {
        setTimeout(function () {
            res.send(cards);
        }, Math.random() * 1000);
    });

});

