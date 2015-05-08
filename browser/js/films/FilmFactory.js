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
		
        }, //close getFilms method

        putStats: function(cartItems) {
            console.log(typeof cartItems);
            console.log("cartItems: ",cartItems);
            
            var purchasestats = {};
            
            // var purchases = cartItems;

            // console.log("purchases: ",purchases);
            var l = cartItems.length;

            for(var i=0; i<l; i++){
                var filmstat = {}
                filmstat._id = cartItems[i].film._id;
                filmstat.count = cartItems[i].quantity
                purchasestats[i] = filmstat
            }
            console.log("purchasestats: ",purchasestats);

            function put_it(thingtoput){
                console.log("put_it FIRED!");
                return $http.put('/api/films', thingtoput)
                .then(function(){
                    console.log('success')
                })
                .catch(function(err){
                    console.log(err)
                })
            }

            put_it(purchasestats);
            
        
        } // close putStats method       

	} // close returned FilmFactory object.
});
