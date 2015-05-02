app.config(function ($stateProvider) {

    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/admin/admin.html',
        controller: 'AdminCtrl',
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            admin: true
        }
    });

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