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
               return pdpFactory.getInfo('5532c18a0dad5827ab24af49');
            }
        }
    });
});

app.factory('pdpFactory', function ($http) {
    return {
        getInfo: function (pid) {
            return $http.get('/api/products/:pid').then(function (response) {
                return response.data;
            });
        }
    };
});

app.controller('PdpCtrl', function ($scope, pdpInfo) {
  $scope.film = pdpInfo; 

  // retrieve category names from object ids later
  $scope.categories = getCategories($scope.film.categories);
})