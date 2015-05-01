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
	promoApplied: {type: Boolean, required: true, default: false}, 
	promoDiscount: {type: Number, required: true, default: 0}
});


// mongooseSchema.methods.myMethod >> used for actions/transforms you might want to perform on the returned instance obj itself... 
// i.e. pull a price and discount, or override a value in the returned object... 

// for a more 'global' method that you want available 

orderSchema.statics.getRanking = function getRanking(cb){
	
	// return this.model('Order').find({}, cb);
	// return this.model('Order').find({'lineItems.0.quantity' : 4}, cb);
	
	var testObj = this.model('Order').find({'lineItems.0.quantity' : 1}).exec(cb);
	console.log(testObj)
	// console.log(testObj.lineItems)

	// return testObj;
	// return testObj.lineItems;
	// return this.find({lineItems[0].quantity : 4}, cb);
}

mongoose.model('Order', orderSchema);
// This creates/registers a Constructor/Class 'Order' (or whatever we call the variable)
// OrderConstructor = mongoose.model('Order', orderSchema);
// var OrderInstance = new OrderConstructor

// statics are available on OrderConstructor
// methods are available on OrderInstance
