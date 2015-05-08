'use strict';
app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/admin/admin.html',
        controller: 'AdminCtrl',
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            admin: true
        }
    })
      .state('admin.welcome', {
        url: '/welcome',
        templateUrl: 'js/admin/templates/welcome.html'
      })
      .state('admin.products', {
        url: '/products',
        templateUrl: 'js/admin/templates/products.html',
        controller: 'filmsCtrl'
      })
      .state('admin.editproduct', {
        url: '/edit/:pid',
        templateUrl: 'js/admin/templates/edit-product.html',
        controller: 'PdpCtrl',
        resolve: {
          pdpInfo: function ($stateParams, Product) {
             return Product.get($stateParams.pid);
          }
        }
      })
      .state('admin.addproduct', {
        url: '/products/add',
        templateUrl: 'js/admin/templates/add-product.html',
        controller: 'PdpCtrl',
        resolve: {
          pdpInfo: function () {
            return null;
          }
        }
      })
      .state('admin.categories', {
        url: '/categories',
        templateUrl: 'js/admin/templates/categories.html',
        controller: 'filmsCtrl'
      })
      .state('admin.addcategory', {
        url: '/categories/add',
        templateUrl: 'js/admin/templates/add-category.html',
        controller: 'filmsCtrl'
      })
      .state('admin.users', {
        url: '/users',
        templateUrl: 'js/admin/templates/users.html',
        controller: 'UserCtrl'
      })
});

app.controller('AdminCtrl', function ($scope, AuthService) {
  $scope.user = null;

  var setUser = function () {
    AuthService.getLoggedInUser().then(function (user) {
        $scope.user = user;
    });
  };

  setUser();

});

