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