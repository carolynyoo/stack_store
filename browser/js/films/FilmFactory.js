'use strict';
app.factory('FilmFactory', function ($http) {
	return {
		getFilms: function(category){
			return $http.get('/api/films', { 
                // params: {categories: "5532c18a0dad5827ab24af49"}
                params: {categories: category}
                // console.log("PARAMS:",params);
                // params: {title: "The Matrix"}  
            }).then(function (response) {
                return response.data;
            });
		}
	}
});
