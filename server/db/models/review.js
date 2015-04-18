var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/tripplanner');

//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

var reviewSchema = new mongoose.Schema({
// add review schema here

    user_id: ObjectId,    // reference user collection
    date: {type: date},
    comment: String,
    rating: Number,
    product_id: ObjectId, // should rename to movie_id at some point
    _id: ObjectId

});

module.exports = {
    Review: mongoose.model('Review', reviewSchema),
};
