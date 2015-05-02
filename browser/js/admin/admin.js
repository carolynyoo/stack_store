app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/admin/admin.html',
        controller: 'AdminCtrl',
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            admin: true
        },
        onEnter: function($state, $timeout) {
          $timeout(function() {
            $state.go('admin.welcome')
          })
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
      .state('admin.products.pid', {
        url: '/products/:pid',
        templateUrl: 'js/admin/templates/pid.html',
        controller: 'PdpCtrl',
        resolve: {
            product: function ($stateParams, pdpFactory) {
                return pdpFactory.getInfo($stateParams.pid);
            }
        }
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

