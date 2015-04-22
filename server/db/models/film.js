var mongoose = require('mongoose');

//mongoose.connect('mongodb://localhost/tripplanner');

//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

var filmSchema = new mongoose.Schema({
// add film schema here
  title: {type: String, required: true},
  categories: [{type:mongoose.Schema.Types.ObjectId, ref: 'Category'}],
  description: String,
  price: {type: Number, required: true},
  photo: {type: String, default: 'http://placehold.it/200x300'},
  inventory: {type: Number, required: true}
});

module.exports = mongoose.model('Film', filmSchema);

