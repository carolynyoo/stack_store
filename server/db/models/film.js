var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/tripplanner');

//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

var filmSchema = new mongoose.Schema({
// add film schema here

title: String,
categories: [ObjectId],
description: String,
price: Number,
photo: String,
_id: ObjectId
});

module.exports = {
    Film: mongoose.model('Film', filmSchema),
};
