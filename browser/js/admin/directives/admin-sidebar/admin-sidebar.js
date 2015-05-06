'use strict';
app.directive('adminSidebar', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/admin/directives/admin-sidebar/admin-sidebar.html',
        link: function (scope) {
          scope.items = [
            { label: 'Products', state: 'admin.products' },
            { label: 'Categories', state: 'admin.categories' },
            { label: 'Orders', state: 'admin.orders'},
            { label: 'Users', state: 'admin.users'}
          ];
        }
    };
});