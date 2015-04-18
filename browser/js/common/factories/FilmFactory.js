'use strict';

app.factory('FilmFactory', function ($http) {
	return {
		getFilms: function(){
			return $http.get('/cards', {}).then(function (response) {
                return response.data;
            });
		}
	}
});