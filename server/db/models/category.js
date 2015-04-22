var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/tripplanner');

//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

var categorySchema = new mongoose.Schema({
// add category schema here
    name: {type: String, required: true}
});

module.exports = mongoose.model('Category', categorySchema);
