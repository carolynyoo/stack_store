var mongoose = require('mongoose');

var lineItemSchema = new mongoose.Schema({
	film: {type:mongoose.Schema.Types.ObjectId, ref: 'Film'},
	quantity: {type: Number, default: 1, required: true}
})

var cartSchema = new mongoose.Schema({
	lineItems: [lineItemSchema],
	user: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
	sessionId: {type: String, required: true},
	promoApplied: {type: Boolean, required: true}, 
	promoDiscount: {type: Number, required: true, default: 0},
	closed: {type: Boolean, required: true, default: false}
});

mongoose.model('Cart', cartSchema);
mongoose.model('LineItem', lineItemSchema);