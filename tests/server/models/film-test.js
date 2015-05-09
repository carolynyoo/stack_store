var dbURI = 'mongodb://localhost:27017/testingDB';
var clearDB = require('mocha-mongoose')(dbURI);

var sinon = require('sinon');
var expect = require('chai').expect;
var mongoose = require('mongoose');

require('../../../server/db/models/film');

var Film = mongoose.model('Film');



describe('Film Model:', function(){
		var film;
	beforeEach('Establish DB connection', function(done){
		if (mongoose.connection.db) return done();
		mongoose.connect(dbURI, done);
		film = new Film();
	});

	afterEach('Clear test database', function(done){
		clearDB(done);
	});

	it('should exist', function() {
	    expect(Film).to.be.a('function');
	});

	it('should have a title of non-zero length', function(done) {
	        expect(film).to.have.property('title');
	        // check for empty
	        done();    
	});

	it('should have a description', function(done) {
	        expect(film).to.have.property('description');
	        done();    
	});

	it('should have a price', function(done) {
	        expect(film).to.have.property('price');
	        // check type number
	        done();    
	});

	it('should have a link to the photo', function(done) {
	        expect(film).to.have.property('photo');
	        // check 
	        done();    
	});

	it('should have an inventory', function(done) {
	        expect(film).to.have.property('inventory');
	        // check type number
	        done();    
	});

	it('should have a counter for times purchased', function(done) {
	        expect(film).to.have.property('purchased');
	        // check type number
	        done();    
	});

	// Negative test to show that it would fail
	xit('should have a counter for times purchased', function(done) {
	        expect(film).to.not.have.property('purchased');
	        // check type number
	        done();    
	});

	it('should have a categories array', function(done) {
	        expect(film).to.have.property('categories');
	        // check type number
	        done();    
	});

	// Add more tests here

});

