var mongoose = require('mongoose');

var lineItemSchema = new mongoose.Schema({
	film: {type:mongoose.Schema.Types.ObjectId, ref: 'Film'},
	quantity: {type: Number, default: 1, required: true}
})

var orderSchema = new mongoose.Schema({
	lineItems: [lineItemSchema],
	sessionId: {type: String, required: true},
	user: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
	status: {type: String, required: true, default: "Inactive"},
	datetime: {type: Date, required: true},
	confirmationNumber: {type: String, required: true},
	totalPurchaseAmount: {type: Number, required: true},
	promoApplied: {type: Boolean, required: true, default: false}, 
	promoDiscount: {type: Number, required: true, default: 0}
});

mongoose.model('Order', orderSchema);