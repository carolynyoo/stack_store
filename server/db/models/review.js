var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/tripplanner');

//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

var reviewSchema = new mongoose.Schema({
// add review schema here

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},    // reference user collection
    date: {type: Date, default: Date.now},
    comment: {type:String, required: true},
    rating: {type: Number, min: 0, max: 5},
    film: {type: mongoose.Schema.Types.ObjectId, ref: 'Film'}
});

mongoose.model('Review', reviewSchema);