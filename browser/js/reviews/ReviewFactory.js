'use strict'

app.factory('ReviewFactory', function($http) {
    return {
        getReviews: function(filmid){
             return $http.get('api/reviews/'+filmid).then(function(response) {
                 return response.data;
             });
        }
    }
})


