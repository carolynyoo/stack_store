app.config(function ($stateProvider) {

    $stateProvider.state('yourAccount', {
        url: '/your-account',
        templateUrl: 'js/your-account/your-account.html',
        controller: 'AccountCtrl',
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });

});

app.controller('AccountCtrl', function ($scope) {
    
})