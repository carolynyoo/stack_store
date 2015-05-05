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

app.factory('Product', function ($state, $http) {
    return {
        get: function (pid) {
            return $http.get('/api/products/'+pid).then(function (response) {
                return response.data;
            });
        },
        add: function () {
            return $http.post('/api/products').then(function (response) {
                $state.go('admin.products');
            },
            function (error) {
                console.log(error);
            })
        },
        update: function (pid, newData) {
            return $http.put('/api/products/'+pid, newData).then(function (response) {
                $state.go('admin.products');
            },
            function (error) {
                console.log(error);
            })
        },
        delete: function (pid) {
            $http.delete('/api/products/'+pid).success(function (response) {
                $state.go('admin.products');
            })
            .error(function (err) {
                console.log("error:"+err);
            })
        }
    };
});

app.controller('PdpCtrl', function ($scope, $http, $stateParams, $state, pdpInfo, Product, CategoryFactory) {
  $scope.film = pdpInfo;
  $scope.formData = $scope.film;
  $scope.newData = {};

    $scope.getCategories = function(){
      CategoryFactory.getCategories()
        .then(function(categoriesfromserver){
          $scope.categories = categoriesfromserver;
        })
        .catch(function(err){
          console.log("error! : ",err);
        }); 
    } // close getCategories

    $scope.getCategories();

  $scope.add = function () {
    return Product.add($scope.newData);
  }

  $scope.edit = function () {
    return Product.update($scope.film._id, $scope.formData);
  }

  $scope.delete = function () {
    return Product.delete($scope.film._id);
  }

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