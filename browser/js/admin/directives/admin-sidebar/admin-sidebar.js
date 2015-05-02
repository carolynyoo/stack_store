'use strict';
app.directive('adminSidebar', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/admin/directives/admin-sidebar/admin-sidebar.html',
        link: function (scope) {
          scope.items = [
            { label: 'Products', state: 'products' },
            { label: 'Categories', state: 'categories' },
            { label: 'Orders', state: 'orders'},
            { label: 'Users', state: 'users'}
          ];
        }
    };
});