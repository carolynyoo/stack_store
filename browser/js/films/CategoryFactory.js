'use strict';
app.factory('CategoryFactory', function ($http, $state) {
	return {
		getCategories: function(){
			return $http.get('/api/categories', { 
                // params: {key: val}
            }).then(function (response) {
                return response.data;
            });
		},
        add: function (category) {
        return $http.post('/api/categories', category).then(function (response) {
            $state.go('admin.categories');
            return response.data;
        },
        function (error) {
            console.log(error);
        })}, 
        delete: function (id) {
        return $http.delete('/api/categories/'+id).then(function (response) {
            $state.go($state.current, {}, {reload: true});
        }, 
        function (err) {
            console.log("error:"+err);
        })}
	}
});