var mongoose = require('mongoose');

var cartSchema = new mongoose.Schema({
	films: [{type:mongoose.Schema.Types.ObjectId, ref: 'Film'}],
	session: {type: String, required: true}
})

mongoose.model('Cart', cartSchema);