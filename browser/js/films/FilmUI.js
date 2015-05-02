'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('films', {
        url: '/films',
        templateUrl: 'js/films/films.html',
        controller: 'filmsCtrl'
    });
});

app.controller('filmsCtrl', function ($scope, FilmFactory, CategoryFactory) {
  
  $scope.getMovies = function(filter){
    FilmFactory.getFilms(filter)
      .then(function(filmsfromserver){
        $scope.films = filmsfromserver;
      })
      .catch(function(err){
        console.log("error! : ",err);
      }); 
  }; // close getMovies

  $scope.getMovies();

  $scope.getCategories = function(){
      CategoryFactory.getCategories()
        .then(function(categoriesfromserver){
          $scope.categories = categoriesfromserver;
        })
        .catch(function(err){
          console.log("error! : ",err);
        }); 
    } // close getCategories

    $scope.getCategories();
    
}); // end filmsCtrl

app.filter("centsToDollars", function() {
  return function (amountInCents) {
    return (amountInCents/100).toFixed(2);
  }
});