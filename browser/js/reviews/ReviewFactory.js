'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('review', {
        url: '/review/:id',
        templateUrl: 'js/reviews/review.html',
        controller: 'ReviewCtrl',
        resolve: {
            pdpInfo: function ($stateParams, pdpFactory, Session) {


               // return pdpFactory.getInfo($stateParams.pid);
               // Matrix test for now - do not have category view wired up yet 
               //return pdpFactory.getInfo('5536f882712a688124e77b80');
               return pdpFactory.getInfo($stateParams.id);

            }
        }
    });
});


app.factory('ReviewFactory', function($http) {
    return {
        getReviews: function(filmid){
             return $http.get('api/reviews/'+filmid).then(function(response) {
                 return response.data;
             });
        },
        createReview: function () {
            return $http.post('/api/reviews/').then(function (response) {
                return response.data;
            });
        }
    };
});




app.controller('ReviewCtrl', function ($scope, $http, $stateParams, $state, pdpInfo, Session) {
  $scope.film = pdpInfo; 

  var userId = Session.user._id;

  console.log("this is scope object", $scope);


  $scope.createReview = function () {
		// Hardcode User for now
		// Hardcore Film for now "553bf80eecb6b2672cc36f27" for Batman
		$http.post('/api/review/', {user: userId, comment: $scope.review.comment, rating: $scope.review.rating, film: $scope.film._id}).
			success(function(data) {
			    console.log("Review created!");
			    $state.go('orders');
//			    return response.data;
			}).
			error(function(data) {
				console.log(data);
			    console.log("Error creating review!");
			});
	};

  // $scope.addReviewToFilm = function() {
  //   $http.post('/api/review', {filmId: $stateParams.pid}).
  //   success(function() {
  //   	// Get data from form fields
  //   	// Rating
  //   	// Comment

  //       console.log("Review added to Film!");
  //       $state.go('home');
  //   }).
  //   error(function() {
  //       console.log("Error reviewing film");
  //   });

  // };

});