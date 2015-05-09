'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'homeCtrl'
    });
});

app.controller('homeCtrl', function ($scope, HomeFactory, CategoryFactory, cartFactory) {

	$scope.getTop = function(){

		HomeFactory.getFilms()
		.then(function(filmsfromserver){
		$scope.films = filmsfromserver;
		console.log("$scope.films: ",$scope.films);
		})
		.catch(function(err){
		console.log("error! : ",err);
		}); 
	};

	$scope.getTop();

    $scope.addFilmToCart = function (pid) {
      // console.log("addFilmToCart FIRED")
      return cartFactory.addToCart(pid);
    }

});

app.factory('HomeFactory', function ($http) {
	return {
		getFilms: function(category){
			return $http.get('/api/home', {})
				.then(function (response) {
                	return response.data;
            	});
		}
	}
});