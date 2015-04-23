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

app.controller('filmsCtrl', function ($scope, FilmFactory) {
  
  $scope.getMovies = function(filter){
    FilmFactory.getFilms(filter)
      .then(function(filmsfromserver){
        $scope.films = filmsfromserver;
        console.log("$scope.films: ",$scope.films);
      })
      .catch(function(err){
        console.log("err mofo! : ",err);
      }); 
  } // close getMovies

  $scope.getMovies();

}); // end filmsCtrl