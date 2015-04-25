'use strict';

app.factory('FilmFactory', function ($http) {
	return {
		getFilms: function(){
			return $http.get('/api/films').then(function (response) {
                return response.data;
            });
		}
	}
});


/*app.factory('pdpFactory', function ($http) {
    return {
        getInfo: function (pid) {
            return $http.get('/api/products/:pid').then(function (response) {
                return response.data;
            });
        }
    };
});*/