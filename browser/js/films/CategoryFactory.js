'use strict';

app.factory('CategoryFactory', function ($http) {
	return {
		getCategories: function(){
			return $http.get('/api/categories', { 
                // params: {key: val}
            }).then(function (response) {
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