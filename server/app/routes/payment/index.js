'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var stripe = require("stripe")("sk_test_HBCZj61dKC79pvTGHDGm76EY");

router.post('/', function(req, res, next) {

    var stripeToken = req.body.stripeToken;

    // console.log("This is request", req);
    var purchaseTotal = req.body.total;
    console.log("This is purchase total:", purchaseTotal);

    var charge = stripe.charges.create({
        amount: purchaseTotal, // amount in cents, again
        currency: "usd",
        source: stripeToken,
        description: "Example charge"
    }, function(err, charge) {
        if (err && err.type === 'StripeCardError') {
            // The card has been declined
            console.log("Your card has been declined");
            next(err);
        } else {
            // Do stuff here

            res.json(charge);
        }
    });


});