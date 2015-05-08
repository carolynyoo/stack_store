app.factory('User', function ($state, $http) {
  return {
    get: function () {
      return $http.get('/api/users').then(function (response) {
        return response.data;
      })
    }
  }
});


app.controller('UserCtrl', function ($scope, AuthService, $state, $http, User) {

  $scope.get = function () {
    User.get().then(function (users) {
      $scope.users = users;
    })
    .catch(function (err) {
      console.log('error! :', err);
    })
  };

  $scope.get();

    // $scope.error = null;
    // $scope.newAccount = {};

    // $scope.createAccount = function (newAccount) {

    //   $scope.error = null;

    //   $http.post('/api/new-user', newAccount).
    //     success(function(data) {
    //       console.log("New user successfully registered!");

    //             //Automatically log in after creating a new account

    //             AuthService.login({email: newAccount.email, password: newAccount.password}).then(function () {
    //                 $state.go('home');
    //             }).catch(function () {
    //                 $scope.error = 'Invalid login credentials.';
    //             });
    //     }).
    //     error(function(data) {
    //       console.log("Some error occurred during account registration.");
    //     });
    // };

});