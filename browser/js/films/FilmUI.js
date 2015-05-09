'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('films', {
        url: '/films',
        templateUrl: 'js/films/films.html',
        controller: 'filmsCtrl'
        // resolve: getMovies()
    });
});

app.controller('filmsCtrl', function ($scope, FilmFactory, CategoryFactory, cartFactory) {
  $scope.category = {
    name: null
  };

  $scope.add = function () {
    return CategoryFactory.add($scope.category);
  }

  $scope.delete = function (id) {
    return CategoryFactory.delete(id);
  }

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



  $scope.getRegex = function(){
    FilmFactory.getRegex($scope.searchstring)
    .then(function(filmsfromserver){
      $scope.films = filmsfromserver;
    })
    .then(function(){
      var wipe = "";
      $scope.searchstring = angular.copy(wipe);
      $scope.regexsearch.$setPristine();
    })
    .catch(function(err){
      console.log("error! : ",err);
    }); 
  };


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

    $scope.addFilmToCart = function (pid) {
      return cartFactory.addToCart(pid);
    }
    
}); // end filmsCtrl

app.filter("centsToDollars", function() {
  return function (amountInCents) {
    return (amountInCents/100).toFixed(2);
  }
});