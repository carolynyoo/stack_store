'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('review', {
        url: '/review/:id',
        templateUrl: 'js/reviews/review.html',
        controller: 'ReviewCtrl',
        resolve: {
            pdpInfo: function ($stateParams, pdpFactory, Session) {
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

		$http.post('/api/review/', {user: userId, comment: $scope.review.comment, rating: $scope.review.rating, film: $scope.film._id}).
			success(function(data) {
			    console.log("Review created!");
			    $state.go('orders');
			}).
			error(function(data) {
				console.log(data);
			    console.log("Error creating review!");
			});
	};

});