var mongoose = require('mongoose');

var cartSchema = new mongoose.Schema({
// add cart schema here

  // cart has user but not necessarily when created
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  
  // contains Film and quantity
  items: [{type: mongoose.Schema.Types.ObjectId, ref: 'Film'},{quantity: Number}],
  
  //subtotal: {type: Number}, // if needed but can calculate later
  //total: {type: Number}

});

mongoose.model('Cart', cartSchema);
