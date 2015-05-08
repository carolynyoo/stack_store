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

});