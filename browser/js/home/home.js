'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'homeCtrl'
    });
});

app.controller('homeCtrl', function ($scope, HomeFactory, CategoryFactory) {

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