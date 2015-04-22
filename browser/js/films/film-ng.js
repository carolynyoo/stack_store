'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('films', {
        url: '/films',
        templateUrl: 'js/films/films.html',
        controller: 'filmsCtrl',
        resolve: {
            returnFilms: function ($stateParams, FilmFactory) {
               // return pdpFactory.getInfo($stateParams.pid);
               // Matrix test for now - do not have category view wired up yet 
               return FilmFactory.getFilms();
            }
        }
    });
});

app.controller('filmsCtrl', function ($scope, pdpInfo) {
  $scope.film = returnFilms; 
})