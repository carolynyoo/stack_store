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
var Review = mongoose.model('Review');
var q = require('q');
var chalk = require('chalk');

var getCurrentUserData = function () {
    return q.ninvoke(User, 'find', {});
};

var getCurrentCategoryData = function () {
    return q.ninvoke(Category, 'find', {});
};

var getCurrentFilmData = function () {
  return q.ninvoke(Film, 'find', {});
}

var getCurrentReviewData = function () {
  return q.ninvoke(Review, 'find', {});
}



var seedUsers = function () {

    var users = [
        {
            email: 'testing@fsa.com',
            name: 'Testing',
            password: 'password'
        },
        {
            email: 'obama@gmail.com',
            name: 'Obama',
            password: 'potus'
        }
    ];

    return q.invoke(User, 'create', users);

};


var seedFilms = function () {

    var films = [
    {
        title: 'Die Hard',
        categories: ['5532c18a0dad5827ab24af3c', '5532c18a0dad5827ab24af49', '5532c18a0dad5827ab24af46'],
        description: 'this movie rocks',
        price: 599,
        photo: 'http://www.impawards.com/1988/posters/die_hard.jpg',
        inventory: 5 
    },
    {
        title: 'The Dark Knight',
        categories: ['5532c18a0dad5827ab24af49', '5532c18a0dad5827ab24af3c'],
        description: 'The caped crusader must come to terms with one of the greatest psychological tests of his inability to fight justice.',
        price: 1337,
        photo: 'http://ia.media-imdb.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX640_SY720_.jpg',
        inventory: 15 
    },
    {
        title: 'When Harry Meets Sally',
        categories: ['5532c18a0dad5827ab24af46', '5532c18a0dad5827ab24af3f'],
        description: 'Can two friends sleep together and still love each other in the morning?',
        price: 399,
        photo: 'http://images.moviepostershop.com/when-harry-met-sally-movie-poster-1989-1020470291.jpg',
        inventory: 2 
    },
    {
        title: 'Superbad',
        categories: ['5532c18a0dad5827ab24af3f'],
        description: 'Seth and Evan are best friends, inseparable, navigating the last weeks of high school.',
        price: 899,
        photo: 'http://www.impawards.com/2007/posters/superbad.jpg',
        inventory: 8 
    }, 
    {
        title: 'Toy Story',
        categories: ['5532c18a0dad5827ab24af3e'],
        description: "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room",
        price: 2099,
        photo: 'http://www.family-flix.com/wp-content/uploads/2015/01/toy-story.jpeg',
        inventory: 10
    }, 
    {
        title: 'The Ring',
        categories: ['5532c18a0dad5827ab24af43'],
        description: 'A journalist must investigate a mysterious videotape which seems to cause the death of anyone in a week of viewing it.',
        price: 399,
        photo: 'http://images.moviepostershop.com/the-ring-movie-poster-2002-1020189818.jpg',
        inventory: 8
    },
    {
        title: 'The Matrix',
        categories: ['5532c18a0dad5827ab24af49'],
        description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
        price: 299,
        photo: 'http://www.1art1.de/images/imagel/m//m1210.jpg',
        inventory: 8
    }
    ];

    return q.invoke(Film, 'create', films);

};


var seedReviews = function () {
    var reviews = [
        
        {user: "5532c9d007456cf6297ab1f5",    // reference user collection
        date: "Wed Jul 27 16:54:49 EST 2011",
        comment: "This movie is cool",
        rating: 4,
        film: "5536f882712a688124e77b80"},    // reference film collection
              
    ]; 

    return q.invoke(Review, 'create', reviews);
}



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

    // review
    var reviewPromise = getCurrentReviewData().then(function (reviews) {
        if (reviews.length === 0) {
            return seedReviews();
        } else {
            console.log(chalk.magenta('Seems to already be review data, exiting!'));
            return; 
        }
    }).then(function (reviews) {
        if (reviews) {
            console.log(chalk.green('Review seed successful!'));
        }
    });


    promisesForSeeds.push(userPromise, catPromise, filmPromise, reviewPromise);

    q.all(promisesForSeeds).then(function () {
        console.log(chalk.blue('All seeds successful!'));
        process.kill(0);
    }).catch(function (err) {
        console.error(err);
        process.kill(1);
    });
});
