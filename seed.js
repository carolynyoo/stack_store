/*

This seed file is only a placeholder. It should be expanded and altered
to fit the development of your application.

It uses the same file the server uses to establish
the database connection:
--- server/db/index.js

The name of the database used is set in your environment files:
--- server/env/*

This seed file has a safety check to see if you already have users
in the database. If you are developing multiple applications with the
fsg scaffolding, keep in mind that fsg always uses the same database
name in the environment files.

Refer to the q documentation for why and how q.invoke is used.

*/

var mongoose = require('mongoose');
var connectToDb = require('./server/db');
var User = mongoose.model('User');
var Category = mongoose.model('Category');
var Film = mongoose.model('Film');
var q = require('q');
var chalk = require('chalk');

var getCurrentUserData = function () {
    return q.ninvoke(User, 'find', {});
};

var getCurrentCategoryData = function () {
    return q.ninvoke(Category, 'find', {});
};

var seedUsers = function () {

    var users = [
        {
            email: 'testing@fsa.com',
            password: 'password'
        },
        {
            email: 'obama@gmail.com',
            password: 'potus'
        }
    ];

    return q.invoke(User, 'create', users);

};


var seedFilms = function () {

    var films = [{
        title: 'Die Hard',
        categories: [ObjectId('5532c18a0dad5827ab24af3c'), ObjectId('5532c18a0dad5827ab24af49'), ObjectId('5532c18a0dad5827ab24af46')],
        description: 'this movie rocks',
        price: 599,
        photo: 'http://www.impawards.com/1988/posters/die_hard.jpg',
        inventory: 5 
        }];

    return q.invoke(Film, 'create', films);

};



var seedCategories = function () {
    var categories = [
        { name: 'Action' }, 
        { name: 'Adventure' }, 
        { name: 'Animation' }, 
        { name: 'Comedy' }, 
        { name: 'Documentary' }, 
        { name: 'Drama' }, 
        { name: 'Fantasy' }, 
        { name: 'Horror' },
        { name: 'Musical' },
        { name: 'Mystery' },
        { name: 'Romance' },
        { name: 'Sci-Fi' },
        { name: 'Sport' },
        { name: 'Thriller'}
    ]; 

    return q.invoke(Category, 'create', categories);
}

connectToDb.then(function () {
    var promisesForSeeds = []; 
    // users
     var userPromise = getCurrentUserData().then(function (users) {
        if (users.length === 0) {
            return seedUsers();
        } else {
            console.log(chalk.magenta('Seems to already be user data, exiting!'));
            return;
        }
    }).then(function (users) {
        if (users) {
          console.log(chalk.green('User seed successful!'));
        }
    });

    // films
     var filmPromise = getCurrentFilmData().then(function (films) {
        if (films.length === 0) {
            return seedFilms();
        } else {
            console.log(chalk.magenta('Seems to already be film data, exiting!'));
            return;
        }
    }).then(function (films) {
        if (films) {
          console.log(chalk.green('Film seed successful!'));
        }
    });



    // category
    var catPromise = getCurrentCategoryData().then(function (categories) {
        if (categories.length === 0) {
            return seedCategories();
        } else {
            console.log(chalk.magenta('Seems to already be category data, exiting!'));
            return; 
        }
    }).then(function (categories) {
        if (categories) {
            console.log(chalk.green('Category seed successful!'));
        }
    });

    promisesForSeeds.push(userPromise, catPromise, filmPromise);

    q.all(promisesForSeeds).then(function () {
        console.log(chalk.blue('All seeds successful!'));
        process.kill(0);
    }).catch(function (err) {
        console.error(err);
        process.kill(1);
    });
});
