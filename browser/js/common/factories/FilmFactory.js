'use strict';

app.factory('FilmFactory', function ($http) {
	return {
		getFilms: function(){
			return $http.get('/api/films', {}).then(function (response) {
                return response.data;
            });
		}
	}
});