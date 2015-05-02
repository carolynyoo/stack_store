'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('pdp', {
        url: '/products/:pid',
        templateUrl: 'js/pdp/pdp.html',
        controller: 'PdpCtrl',
        resolve: {
            pdpInfo: function ($stateParams, Product) {
               return Product.get($stateParams.pid);
            }
        }
    });
});

app.factory('Product', function ($http) {
    return {
        get: function (pid) {
            return $http.get('/api/products/'+pid).then(function (response) {
                return response.data;
            });
        },
        update: function (pid, newData) {
            return $http.put('/api/products', newData).then(function (response) {
                return response.data;
            })
        },
        delete: function (pid) {
            return $http.delete('/api/products'+pid).then(function (response) {
                return response.data;
            })
        }
    };
});

app.controller('PdpCtrl', function ($scope, $http, $stateParams, $state, pdpInfo) {
  $scope.formData = {};

  $scope.film = pdpInfo;

  // to be refactored into factory
  $scope.addFilmToCart = function() {
    $http.post('/api/cart', {filmId: $stateParams.pid}).
    success(function() {
        console.log("Item added to cart!");
        $state.go('cart');
    }).
    error(function() {
        console.log("Error adding item to cart");
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