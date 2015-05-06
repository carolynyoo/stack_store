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

var wipeDb = function () {
    var models = [User, Category, Film, Review];

    var promises = models.map(function (model) {
        return model.find({}).remove().exec();
    });

    return q.all(promises);

}


var findIdFromDb = function (elem, db, keyName) {
    for (var entry in db) {
        if (db[entry][keyName]===elem) {
            return db[entry]._id;
        }
    }
}

var seedUsers = [
    {
        email: 'testing@fsa.com',
        name: 'Testing',
        password: 'password'
    },
    {
        email: 'obama@gmail.com',
        name: 'Obama',
        password: 'potus',
        admin: true
    }
];

var seedCategories =  [
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

var seedFilms = [
    // seed categories by name
    {
        title: 'Die Hard',
        categories: ['Thriller', 'Drama', 'Action'],
        description: 'this movie rocks',
        price: 599,
        photo: 'https://d12vb6dvkz909q.cloudfront.net/uploads/galleries/16517/die-hard-poster.jpg',
        inventory: 5 
    },
    {
        title: 'The Dark Knight',
        categories: ['Drama', 'Action'],
        description: 'The caped crusader must come to terms with one of the greatest psychological tests of his inability to fight justice.',
        price: 1337,
        photo: 'http://ia.media-imdb.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX640_SY720_.jpg',
        inventory: 15 
    },
    {
        title: 'When Harry Meets Sally',
        categories: ['Romance', 'Comedy'],
        description: 'Can two friends sleep together and still love each other in the morning?',
        price: 399,
        photo: 'http://www.granadatheater.com/files/2015/03/when-harry-met-sally-poster-artwork-billy-crystal-meg-ryan-carrie-fisher.jpg',
        inventory: 2 
    },
    {
        title: 'Superbad',
        categories: ['Comedy'],
        description: 'Seth and Evan are best friends, inseparable, navigating the last weeks of high school.',
        price: 899,
        photo: 'http://images.moviepostershop.com/superbad-movie-poster-2007-1020405577.jpg',
        inventory: 8 
    }, 
    {
        title: 'Toy Story',
        categories: ['Animation'],
        description: "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room",
        price: 2099,
        photo: 'http://www.family-flix.com/wp-content/uploads/2015/01/toy-story.jpeg',
        inventory: 10
    }, 
    {
        title: 'The Ring',
        categories: ['Horror'],
        description: 'A journalist must investigate a mysterious videotape which seems to cause the death of anyone in a week of viewing it.',
        price: 399,
        photo: 'http://images.moviepostershop.com/the-ring-movie-poster-2002-1020189818.jpg',
        inventory: 8
    },
    {
        title: 'The Matrix',
        categories: ['Thriller'],
        description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
        price: 299,
        photo: 'http://www.1art1.de/images/imagel/m//m1210.jpg',
        inventory: 8
    },
    {
        title: 'The Princess Bride',
        categories: ['Fantasy'],
        description: 'A fairy tale adventure about a beautiful young woman and her one true love. He must find her after a long separation and save her. They must battle the evils of the mythical kingdom of Florin to be reunited with each other. Based on the William Goldman novel "The Princess Bride" which earned its own loyal audience.',
        price: 499,
        photo: 'http://posterpress.us/uploads/t/the_princess_bride_1987.jpg',
        inventory: 8
    },
    {
        title: 'Singin\' in the Rain',
        categories: ['Musical'],
        description: 'A spoof of the turmoil that afflicted the movie industry in the late 1920s when movies went from silent to sound. ',
        price: 199,
        photo: 'http://image.tmdb.org/t/p/original/bLbZBIeEqBcDiqUmLare2nv8fAt.jpg',
        inventory: 2
    },
    {
        title: 'Memento',
        categories: ['Mystery', 'Thriller'],
        description: 'Leonard (Guy Pearce) is tracking down the man who raped and murdered his wife. The difficulty, however, of locating his wife\'s killer is compounded by the fact that he suffers from a rare, untreatable form of memory loss. ',
        price: 599,
        photo: 'http://e.movie.as/p/36638.jpg',
        inventory: 10
    }
];

var seedReviews = [
    // seed users and films by name
    {
        user: "Obama", 
        date: new Date (2014, 7, 27, 16, 54, 59),
        comment: "This movie is cool",
        rating: 4,
        film: "Die Hard"
    },
    {
        user: "Obama", 
        date: new Date (2014, 7, 20, 10, 4, 20),
        comment: "This movie is terrible",
        rating: 1,
        film: "The Matrix"
    }
]; 

var createFilms = 
    connectToDb.then(function () {
        return q.invoke(Category, 'create', seedCategories);
    })
    .then(function () {
        return Category.find().exec();
    })
    .then(function (categories) {
        console.log(chalk.green('Category seed successful!'));
        seedFilms.forEach(function (film, filmIndex, filmArr) {
            film['categories'].forEach(function (elem, index, arr) {
                var filmID = findIdFromDb(elem, categories, 'name');
                film['categories'][index] = filmID;
            })
        })
        return q.invoke(Film, 'create', seedFilms);
    })
    .then(function () {
        return Film.find().exec();

    });

var createUsers = 
    connectToDb.then(function () {
        return q.invoke(User, 'create', seedUsers);
    })
    .then (function () {
        return User.find().exec();
    });



connectToDb.then(function () {
    return wipeDb()
})
.then(function() {
    console.log(chalk.blue('Wiped database'));
})
.then(function() {
    q.spread([createFilms, createUsers], function (films, users) {
        console.log(chalk.green('Film and User seed successful!'));
        seedReviews.forEach(function (review, index, arr) {
            var userID = findIdFromDb(review['user'], users, 'name');
            var filmID = findIdFromDb(review['film'], films, 'title'); 
            review['user'] = userID;
            review['film'] = filmID; 
        });
        return q.invoke(Review, 'create', seedReviews);
    })
    .then(function () {
        console.log(chalk.green('Review seed successful!'));
        console.log(chalk.blue('All seeds successful!'));
        process.kill(0);
    })
    .catch(function (err) {
        console.error(err);
        process.kill(1);
    })
})