var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/tripplanner');

//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

var reviewSchema = new mongoose.Schema({
// add review schema here

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},    // reference user collection
    date: {type: Date, default: Date.now},
<<<<<<< HEAD
    comment: {type: String, required: true},
=======
    comment: {type:String, required: true},
>>>>>>> 0ed956b74ee12ad6106346ca916dcff468312e64
    rating: {type: Number, min: 0, max: 5},
    film: {type: mongoose.Schema.Types.ObjectId, ref: 'Film'}
});

mongoose.model('Review', reviewSchema);