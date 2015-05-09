var dbURI = 'mongodb://localhost:27017/fsg-app';
var clearDB = require('mocha-mongoose')(dbURI);

var sinon = require('sinon');
var expect = require('chai').expect;
var mongoose = require('mongoose');

require('../../../server/db/models/review');

var Review = mongoose.model('Review');



describe('Review Model:', function(){
		var review;
	beforeEach('Establish DB connection', function(done){
		if (mongoose.connection.db) return done();
		mongoose.connect(dbURI, done);
		review = new Review();
	});

	afterEach('Clear test database', function(done){
		clearDB(done);
	});

	it('should exist', function() {
	    expect(Review).to.be.a('function');
	});

	xit('should have an associated user', function(done) {
	        expect(review).to.have.property('user');
	        // check for empty
	        done();    
	});

	xit('should have a date', function(done) {
	        expect(review).to.have.property('date');
	        done();    
	});

	xit('should have a comment', function(done) {
	        expect(review).to.have.property('comment');
	        // check type string
	        // check 500 character limit
	        done();    
	});

	xit('should have a rating', function(done) {
	        expect(review).to.have.property('rating');
	        // check 
	        done();    
	});

	xit('should have an associated film', function(done) {
	        expect(review).to.have.property('film');
	        // check film exists
	        done();    
	});

	// Negative test to show that it would fail
	xit('should have a rating', function(done) {
	        expect(Review).to.not.have.property('rating');
	        // check type number
	        done();    
	});



	// Add more tests here

});

