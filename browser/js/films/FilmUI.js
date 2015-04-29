'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('films', {
        url: '/films',
        templateUrl: 'js/films/films.html',
        controller: 'filmsCtrl'
          /*resolve: {
            giveFilms: function ($stateParams, FilmFactory) {
               // return pdpFactory.getInfo($stateParams.pid);
               // Matrix test for now - do not have category view wired up yet 
               return FilmFactory.getFilms();
            }
        }*/
    });
});

app.controller('filmsCtrl', function ($scope, FilmFactory, CategoryFactory) {
  
  $scope.getMovies = function(filter){
    console.log("FILTER: ",filter);
    console.log("FilmFactory.getFilms("+filter+")");
    FilmFactory.getFilms(filter)
      .then(function(filmsfromserver){
        $scope.films = filmsfromserver;
        console.log("$scope.films: ",$scope.films);
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
          console.log("$scope.categories: ",$scope.categories);
        })
        .catch(function(err){
          console.log("error! : ",err);
        }); 
    } // close getCategories

    $scope.getCategories();
    
}); // end filmsCtrl