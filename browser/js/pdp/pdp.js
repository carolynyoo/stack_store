'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('pdp', {
        url: '/products/:pid',
        templateUrl: 'js/pdp/pdp.html',
        controller: 'PdpCtrl',
        resolve: {
            pdpInfo: function ($stateParams, pdpFactory) {
               // return pdpFactory.getInfo($stateParams.pid);
               // Matrix test for now - do not have category view wired up yet 
               //return pdpFactory.getInfo('5536f882712a688124e77b80');
               return pdpFactory.getInfo($stateParams.pid);

            }
        }
    });
});

app.factory('pdpFactory', function ($http) {
    return {
        getInfo: function (pid) {
            return $http.get('/api/products/'+pid).then(function (response) {
                return response.data;
            });
        }
    };
});

app.controller('PdpCtrl', function ($scope, $http, $stateParams, pdpInfo) {
  $scope.film = pdpInfo; 

  $scope.addFilmToCart = function() {
    $http.post('/api/cart', {filmId: $stateParams.pid}).
    success(function() {
        console.log("Item added to cart!");
    }).
    error(function() {
        console.log("Issue adding item to cart");
    });
  };

  // retrieve category names from object ids later
//  $scope.categories = getCategories($scope.film.categories);
});

app.directive('productDetailsBox', function(){

    return {
        restrict: 'E',
        templateUrl: 'js/pdp/productdetails.html',
        
        link: function(scope, el, attr){

        }

};
});

app.directive('productImage', function(){

    return {
        restrict: 'E',
        templateUrl: 'js/pdp/productimage.html',
        
        link: function(scope, el, attr){

        }

};
});

app.directive('filmReview', function(){

    return {
        restrict: 'E',
        templateUrl: 'js/pdp/filmreview.html',
        
        link: function(scope, el, attr){

        }

};
});

app.directive('filmRating', function(){

    return {
        restrict: 'E',
        templateUrl: 'js/pdp/filmrating.html',
        
        link: function(scope, el, attr){

        }

};
});




// need custom filter for currency conversion from cents
app.filter('realCurrency', function(price){   

    // convert here

});



