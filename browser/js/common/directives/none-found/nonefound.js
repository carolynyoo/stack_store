'use strict';
app.directive('noneFound', function () {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/none-found/nonefound.html',
        link: function (scope) {
            scope.errormsg = "Dang. No Movies."
        }
    };

});