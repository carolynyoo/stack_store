var mongoose = require('mongoose');

var orderSchema = new mongoose.Schema({
	films: [{type:mongoose.Schema.Types.ObjectId, ref: 'Film'}],
	sessionId: {type: String, required: true},
	user: {type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
	status: {type: String, required: true},
	datetime: {type: Date, required: true}
});

mongoose.model('Order', orderSchema);