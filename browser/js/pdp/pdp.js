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
        add: function (film) {
            return $http.post('/api/products', film).then(function (response) {
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

app.controller('PdpCtrl', function ($scope, $http, $stateParams, $state, pdpInfo, Product, CategoryFactory, cartFactory) {
  $scope.film = pdpInfo;
  $scope.formData = $scope.film;
  $scope.newData = {
    title: null, 
    description: null,
    price: null,
    inventory: null,
    photo: null
  };

    $scope.getCategories = function(){
      CategoryFactory.getCategories()
        .then(function(categoriesfromserver){
          $scope.categories = categoriesfromserver;
          // $scope.formData.categories = categoriesfromserver;
          $scope.newData.categories = categoriesfromserver;
        })
        .catch(function(err){
          console.log("error! : ",err);
        }); 
    } // close getCategories

    $scope.getCategories();

  $scope.cleanCategories = function (data) {
    return;
  }

  $scope.add = function () {
    return Product.add($scope.newData);
  }

  $scope.edit = function () {
    return Product.update($scope.film._id, $scope.formData);
  }

  $scope.delete = function () {
    return Product.delete($scope.film._id);
  }

  $scope.addFilmToCart = function() {
    return cartFactory.addToCart(); 
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