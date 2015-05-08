'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

// Import User model;
var User = mongoose.model('User');

router.get('/', function (req, res) {
  User.find().exec(function (err, users) {
    if (err) {
      throw err;
    }
    res.json(users);
  })
})