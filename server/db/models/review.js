var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/tripplanner');

//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

var reviewSchema = new mongoose.Schema({
// add review schema here

    user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},    // reference user collection
    date: {type: Date, default: Date.now},
    comment: String,
    rating: {type: Number, min: 0, max: 5},
    film_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Film'}
});

module.exports = {
    Review: mongoose.model('Review', reviewSchema),
};
