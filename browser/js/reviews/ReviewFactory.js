'use strict';

app.factory('ReviewFactory', function($http) {
    return {
        getReviews: function(filmid){
             return $http.get('api/reviews/'+filmid).then(function(response) {
                 return response.data;
             });
        }
    };
});


app.controller('ReviewCtrl', function ($scope, $http, $stateParams, $state, pdpInfo) {
  $scope.film = pdpInfo; 

  $scope.addReviewToFilm = function() {
    $http.post('/api/review', {filmId: $stateParams.pid}).
    success(function() {
    	// Get data from form fields
    	// Rating
    	// Comment

        console.log("Review added to Film!");
        $state.go('home');
    }).
    error(function() {
        console.log("Error reviewing film");
    });

  };

});