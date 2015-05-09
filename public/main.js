'use strict';
var app = angular.module('BadAssMovies', ['ui.router', 'fsaPreBuilt', 'payment', 'angularMoment']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // The given state requires an authenticated admin user.
    var destinationStateRequiresAdmin = function destinationStateRequiresAdmin(state) {
        return state.data && state.data.admin;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {

        // log changes in state
        $rootScope.previousState = fromState.name;
        $rootScope.currentState = toState.name;
        // console.log('Previous state:'+$rootScope.previousState);
        // console.log('Current state:'+$rootScope.currentState);

        if (!destinationStateRequiresAuth(toState) && !destinationStateRequiresAdmin(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                if (destinationStateRequiresAdmin(toState)) {
                    if (user.admin) {
                        $state.go('admin');
                    }
                } else {
                    if (destinationStateRequiresAuth(toState)) {
                        $state.go(toState.name, toParams);
                    }
                }
            } else {
                $state.go('login');
            }
        })['catch'](function () {
            $state.go('login');
        });
    });
});
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
    }).state('admin.welcome', {
        url: '/welcome',
        templateUrl: 'js/admin/templates/welcome.html'
    }).state('admin.products', {
        url: '/products',
        templateUrl: 'js/admin/templates/products.html',
        controller: 'filmsCtrl'
    }).state('admin.editproduct', {
        url: '/edit/:pid',
        templateUrl: 'js/admin/templates/edit-product.html',
        controller: 'PdpCtrl',
        resolve: {
            pdpInfo: function pdpInfo($stateParams, Product) {
                return Product.get($stateParams.pid);
            }
        }
    }).state('admin.addproduct', {
        url: '/products/add',
        templateUrl: 'js/admin/templates/add-product.html',
        controller: 'PdpCtrl',
        resolve: {
            pdpInfo: function pdpInfo() {
                return null;
            }
        }
    }).state('admin.categories', {
        url: '/categories',
        templateUrl: 'js/admin/templates/categories.html',
        controller: 'filmsCtrl'
    }).state('admin.addcategory', {
        url: '/categories/add',
        templateUrl: 'js/admin/templates/add-category.html',
        controller: 'filmsCtrl'
    }).state('admin.users', {
        url: '/users',
        templateUrl: 'js/admin/templates/users.html',
        controller: 'UserCtrl'
    });
});

app.controller('AdminCtrl', function ($scope, AuthService) {
    $scope.user = null;

    var setUser = function setUser() {
        AuthService.getLoggedInUser().then(function (user) {
            $scope.user = user;
        });
    };

    setUser();
});

'use strict';
// Set up the state provider
app.config(function ($stateProvider) {
    $stateProvider.state('cart', {
        url: '/cart',
        templateUrl: 'js/cart/cart.html',
        controller: 'CartCtrl',
        resolve: {
            cartInfo: function cartInfo(cartFactory) {
                return cartFactory.getCart();
            }
        }
    });
});

// Set up the Cart Controller

app.controller('CartCtrl', function ($scope, $http, cartInfo, cartFactory) {

    function calculateSubtotal(allLineItemsInCart) {
        var subtotal = 0;
        for (var i = 0; i < allLineItemsInCart.length; i++) {
            var currentItem = allLineItemsInCart[i];
            subtotal += currentItem.quantity * currentItem.film.price;
        }
        return subtotal;
    }

    $scope.allLineItemsInCart = cartInfo.lineItems;
    $scope.subtotal = calculateSubtotal($scope.allLineItemsInCart);

    $scope.updateQuantity = function (updatedQuantity, index) {
        $scope.allLineItemsInCart[index].quantity = updatedQuantity;
        $http.put('/api/cart/updateQuantity', { index: index, updatedQuantity: updatedQuantity }).then(function (response) {
            console.log('Updated the quantity in the cart!', response.data);
            return response.data;
        });
        $scope.subtotal = calculateSubtotal($scope.allLineItemsInCart);
    };
    // Function to delete an item from the cart

    $scope.removeFilmFromCart = function (film) {
        var filmId = film._id;
        $http.put('/api/cart/removeItem', { filmId: filmId }).success(function (cartInfo) {
            $scope.allLineItemsInCart = cartInfo.lineItems;
            console.log('Item removed from Cart!');
            $scope.subtotal = calculateSubtotal($scope.allLineItemsInCart);
        }).error(function (data) {
            console.log('Error removing item from Cart!');
        });
    };
});

// Factory to get a cart

app.factory('cartFactory', function ($http, $state, $stateParams) {
    return {
        getCart: function getCart() {
            return $http.get('/api/cart').then(function (response) {
                console.log('The data is', response.data);
                return response.data;
            });
        },
        addToCart: function addToCart(pid) {
            var id = pid || $stateParams.pid;
            $http.post('/api/cart', { filmId: id }).success(function () {
                console.log('Item added to cart!');
                $state.go('cart');
            }).error(function () {
                console.log('Error adding item to cart');
            });
        }
    };
});

// Filter for cents -> dollars

app.filter('centsToDollars', function () {
    return function (amountInCents) {
        return (amountInCents / 100).toFixed(2);
    };
});

'use strict';
// Set up the state provider

app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout',
        templateUrl: 'js/checkout/checkout.html',
        controller: 'CheckoutCtrl',
        resolve: {
            cartInfo: function cartInfo(cartFactory) {
                return cartFactory.getCart();
            }
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.controller('CheckoutCtrl', function ($scope, $http, FilmFactory, cartInfo, $state) {

    // var purchasestats = {};

    var cartItems = cartInfo.lineItems;
    // console.log("cartItems-Checkout-type", typeof cartItems);
    // console.log("cartItems: ",cartItems);
    // var l = cartItems.length;
    // console.log("l", l);

    // for(var i=0; i<l; i++){
    // 	var filmstat = {}
    // 	filmstat._id = purchases[i].film._id;
    // 	filmstat.count = purchases[i].quantity
    // 	purchasestats[i] = filmstat
    // }

    // console.log(typeof purchasestats);		
    // console.log("purchasestats: ",purchasestats);

    $scope.putStats = function () {
        console.log('cartItems-2: ', cartItems);
        FilmFactory.putStats(cartItems);
        // FilmFactory.putStats(purchasestats);
    };

    function calculateTotal(allLineItemsInCart) {
        var total = 0;
        for (var i = 0; i < allLineItemsInCart.length; i++) {
            var currentItem = allLineItemsInCart[i];
            total += currentItem.quantity * currentItem.film.price;
        }
        return total;
    }

    $scope.checkout = function () {
        $http.post('/api/checkout', {
            cartInfo: cartInfo, total: $scope.total
        }).success(function (confirmationNumber) {

            // Stripe Token Creation
            Stripe.card.createToken({
                name: $scope.billing.creditCardName,
                number: $scope.billing.creditCardNumber,
                cvc: $scope.billing.creditCardCVC,
                exp_month: $scope.billing.creditExpiration.month,
                exp_year: $scope.billing.creditExpiration.year,
                name: $scope.billing.creditCardName,
                address_line1: $scope.address.street,
                //        address_line2: '',
                address_city: $scope.address.city,
                address_state: $scope.address.state,
                address_zip: $scope.address.zip }, stripeResponseHandler);

            console.log('Order created!');
            console.log('THE CONFIRMATION NUMBER ISSSSSS', confirmationNumber);
            $state.go('confirmation', { confirmationNumber: confirmationNumber });
        }).error(function (data) {
            console.log('Error creating order!');
        });
    };
    $scope.allLineItemsInCart = cartInfo.lineItems;
    $scope.total = calculateTotal($scope.allLineItemsInCart);

    $scope.billing = {};
    $scope.address = {};
    $scope.error = null;

    // Stripe Token Creation
    //Stripe.card.createToken($form, stripeResponseHandler);

    // Put this in a separate API for '/charge' and make that call when hitting submit as well or nest in post request?

    // TEST CARD for Stripe: 4012888888881881

    // Stripe Response Handler
    function stripeResponseHandler(status, response) {
        console.log('Got to Stripe Response Handler');
        //  	var $form = $('#checkout-form');

        if (response.error) {
            // Show the errors on the form
            // $form.find('.payment-errors').text(response.error.message);
            // $form.find('button').prop('disabled', false);
            console.log('This means the form probably had an error');
        } else {

            console.log('this is token:', response);
            // response contains id and card, which contains additional card details
            var token = response.id;

            console.log('Submitted the payment form');

            // Make server call to API/charge
            $http.post('/api/payment', {
                stripeToken: token, total: $scope.total
            }).then(function (data) {
                console.log('Payment Successful!');
            })['catch'](function (data) {
                console.log('Payment Error!');
            });
        }
    }
});
'use strict';
app.factory('CategoryFactory', function ($http, $state) {
    return {
        getCategories: function getCategories() {
            return $http.get('/api/categories', {}).then(function (response) {
                return response.data;
            });
        },
        add: function add(category) {
            return $http.post('/api/categories', category).then(function (response) {
                $state.go('admin.categories');
                return response.data;
            }, function (error) {
                console.log(error);
            });
        },
        'delete': function _delete(id) {
            return $http['delete']('/api/categories/' + id).then(function (response) {
                $state.go($state.current, {}, { reload: true });
            }, function (err) {
                console.log('error:' + err);
            });
        }
    };
});
'use strict';
app.factory('FilmFactory', function ($http) {
    return {
        getFilms: function getFilms(category) {
            return $http.get('/api/films', {
                // params: {categories: "5532c18a0dad5827ab24af49"}
                params: { categories: category }
                // console.log("PARAMS:",params);
                // params: {title: "The Matrix"} 
            }).then(function (response) {
                return response.data;
            });
        }, //close getFilms method

        putStats: function putStats(cartItems) {
            console.log(typeof cartItems);
            console.log('cartItems: ', cartItems);

            var purchasestats = {};

            // var purchases = cartItems;

            // console.log("purchases: ",purchases);
            var l = cartItems.length;

            for (var i = 0; i < l; i++) {
                var filmstat = {};
                filmstat._id = cartItems[i].film._id;
                filmstat.count = cartItems[i].quantity;
                purchasestats[i] = filmstat;
            }
            console.log('purchasestats: ', purchasestats);

            function put_it(thingtoput) {
                console.log('put_it FIRED!');
                console.log('thingtoput: ', thingtoput);
                return $http.put('/api/films', thingtoput).then(function () {
                    console.log('success');
                })['catch'](function (err) {
                    console.log(err);
                });
            }

            put_it(purchasestats);
        } // close putStats method      

    } // close returned FilmFactory object.
    ;
});

'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('films', {
        url: '/films',
        templateUrl: 'js/films/films.html',
        controller: 'filmsCtrl'
        // resolve: getMovies()
    });
});

app.controller('filmsCtrl', function ($scope, FilmFactory, CategoryFactory, cartFactory) {
    $scope.category = {
        name: null
    };

    $scope.add = function () {
        return CategoryFactory.add($scope.category);
    };

    $scope['delete'] = function (id) {
        return CategoryFactory['delete'](id);
    };

    $scope.getMovies = function (filter) {
        FilmFactory.getFilms(filter).then(function (filmsfromserver) {
            $scope.films = filmsfromserver;
        })['catch'](function (err) {
            console.log('error! : ', err);
        });
    }; // close getMovies

    $scope.getMovies();

    $scope.getCategories = function () {
        CategoryFactory.getCategories().then(function (categoriesfromserver) {
            $scope.categories = categoriesfromserver;
        })['catch'](function (err) {
            console.log('error! : ', err);
        });
    }; // close getCategories

    $scope.getCategories();

    $scope.addFilmToCart = function (pid) {
        return cartFactory.addToCart(pid);
    };
}); // end filmsCtrl

app.filter('centsToDollars', function () {
    return function (amountInCents) {
        return (amountInCents / 100).toFixed(2);
    };
});
(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.
    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function ($location) {

        if (!window.io) throw new Error('socket.io not found!');

        var socket;

        if ($location.$$port) {
            socket = io('http://localhost:1337');
        } else {
            socket = io('/');
        }

        return socket;
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getAdminStatus = function () {
            if (!Session.user) {
                return null;
            } else {
                return Session.user.admin;
            }
        };

        this.getLoggedInUser = function () {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.
            if (this.isAuthenticated()) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin)['catch'](function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin)['catch'](function (response) {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();
app.config(function ($stateProvider) {

    $stateProvider.state('new-user', {
        url: '/new-user',
        templateUrl: 'js/new-user/new-user.html',
        controller: 'NewUserCtrl'
    });
});

app.controller('NewUserCtrl', function ($scope, AuthService, $state, $http) {

    $scope.error = null;
    $scope.newAccount = {};

    $scope.createAccount = function (newAccount) {

        $scope.error = null;

        $http.post('/api/new-user', newAccount).success(function (data) {
            console.log('New user successfully registered!');

            //Automatically log in after creating a new account

            AuthService.login({ email: newAccount.email, password: newAccount.password }).then(function () {
                $state.go('home');
            })['catch'](function () {
                $scope.error = 'Invalid login credentials.';
            });
        }).error(function (data) {
            console.log('Some error occurred during account registration.');
        });
    };
});
'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'homeCtrl'
    });
});

app.controller('homeCtrl', function ($scope, HomeFactory, CategoryFactory) {

    $scope.getTop = function () {

        HomeFactory.getFilms().then(function (filmsfromserver) {
            $scope.films = filmsfromserver;
            console.log('$scope.films: ', $scope.films);
        })['catch'](function (err) {
            console.log('error! : ', err);
        });
    };

    $scope.getTop();
});

app.factory('HomeFactory', function ($http) {
    return {
        getFilms: function getFilms(category) {
            return $http.get('/api/home', {}).then(function (response) {
                return response.data;
            });
        }
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state, $rootScope) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go($rootScope.previousState);
        })['catch'](function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
'use strict';

// Set up the state provider
app.config(function ($stateProvider) {
    $stateProvider.state('orders', {
        url: '/orders',
        templateUrl: 'js/orders/orders.html',
        controller: 'OrdersCtrl',
        data: {
            authenticate: true
        },
        resolve: {
            orderInfo: function orderInfo(ordersFactory, Session) {
                var userId = Session.user._id;
                return ordersFactory.getOrders(userId);
            }
        }
    });
});

// Set up the Order controller

app.controller('OrdersCtrl', function ($scope, $state, $http, $stateParams, orderInfo) {
    console.log('This is stateparams:', $stateParams);
    console.log('ORDER INFO IS', orderInfo);

    $scope.allOrdersForUser = orderInfo;
    $scope.hello = 'IT WORKED';

    $scope.film = $stateParams.film;

    //	Review film navigation
    $scope.writeReviewForFilm = function (lineItem) {
        console.log(lineItem);
        var filmid = lineItem.film._id;
        $state.go('review', { id: filmid, film: lineItem.film });
    };
});

// Factory to retrieve an order from the database

app.factory('ordersFactory', function ($http) {
    return {
        getOrders: function getOrders(userId) {
            console.log('TRYING TO GET ORDERS WITH USERID: ', userId);
            return $http.get('/api/orders/' + userId).then(function (response) {
                return response.data;
            });
        },
        getFilmName: function getFilmName(lineItem) {
            var filmid = lineItem.film._id;
            $http.get('/api/products/' + filmid).then(function (response) {
                console.log('this is response object');
                console.log(response.data);
                $scope.film = response.data;
                console.log('this is the scope object');
                console.log($scope);
                console.log('film.title');
                console.log($scope.film.title);
                return response.data;
            });
        }
    };
});

// Filter for cents -> dollars

app.filter('centsToDollars', function () {
    return function (amountInCents) {
        return (amountInCents / 100).toFixed(2);
    };
});

'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('pdp', {
        url: '/products/:pid',
        templateUrl: 'js/pdp/pdp.html',
        controller: 'PdpCtrl',
        resolve: {
            pdpInfo: function pdpInfo($stateParams, Product) {
                return Product.get($stateParams.pid);
            }
        }
    });
});

app.factory('Product', function ($state, $http) {
    return {
        get: function get(pid) {
            return $http.get('/api/products/' + pid).then(function (response) {
                return response.data;
            });
        },
        add: function add(film) {
            return $http.post('/api/products', film).then(function (response) {
                $state.go('admin.products');
            }, function (error) {
                console.log(error);
            });
        },
        update: function update(pid, newData) {
            return $http.put('/api/products/' + pid, newData).then(function (response) {
                $state.go('admin.products');
            }, function (error) {
                console.log(error);
            });
        },
        'delete': function _delete(pid) {
            $http['delete']('/api/products/' + pid).success(function (response) {
                $state.go('admin.products');
            }).error(function (err) {
                console.log('error:' + err);
            });
        }
    };
});

app.controller('PdpCtrl', function ($scope, $http, $stateParams, $state, pdpInfo, Product, CategoryFactory, cartFactory) {
    $scope.film = pdpInfo;
    $scope.formData = $scope.film;
    $scope.newData = {
        title: null,
        description: null,
        price: null,
        inventory: null,
        photo: null
    };

    $scope.getCategories = function () {
        CategoryFactory.getCategories().then(function (categoriesfromserver) {
            $scope.categories = categoriesfromserver;
            // $scope.formData.categories = categoriesfromserver;
            $scope.newData.categories = categoriesfromserver;
        })['catch'](function (err) {
            console.log('error! : ', err);
        });
    }; // close getCategories

    $scope.getCategories();

    $scope.cleanCategories = function (data) {
        return;
    };

    $scope.add = function () {
        return Product.add($scope.newData);
    };

    $scope.edit = function () {
        return Product.update($scope.film._id, $scope.formData);
    };

    $scope['delete'] = function () {
        return Product['delete']($scope.film._id);
    };

    $scope.addFilmToCart = function () {
        return cartFactory.addToCart();
    };

    // retrieve category names from object ids later
    //  $scope.categories = getCategories($scope.film.categories);
});

app.directive('productDetailsBox', function () {

    return {
        restrict: 'E',
        templateUrl: 'js/pdp/productdetails.html',

        link: function link(scope, el, attr) {}

    };
});

app.directive('productImage', function () {

    return {
        restrict: 'E',
        templateUrl: 'js/pdp/productimage.html',

        link: function link(scope, el, attr) {}

    };
});

app.directive('filmReview', function () {

    return {
        restrict: 'E',
        templateUrl: 'js/pdp/filmreview.html',

        link: function link(scope, el, attr) {}

    };
});

app.directive('filmRating', function () {

    return {
        restrict: 'E',
        templateUrl: 'js/pdp/filmrating.html',

        link: function link(scope, el, attr) {}

    };
});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('review', {
        url: '/review/:id',
        templateUrl: 'js/reviews/review.html',
        controller: 'ReviewCtrl',
        resolve: {
            pdpInfo: function pdpInfo($stateParams, Product, Session) {
                return Product.get($stateParams.id);
            }
        }
    });
});

app.factory('ReviewFactory', function ($http) {
    return {
        getReviews: function getReviews(filmid) {
            return $http.get('api/reviews/' + filmid).then(function (response) {
                return response.data;
            });
        },
        createReview: function createReview() {
            return $http.post('/api/reviews/').then(function (response) {
                return response.data;
            });
        }
    };
});

app.controller('ReviewCtrl', function ($scope, $http, $stateParams, $state, pdpInfo, Session) {
    $scope.film = pdpInfo;

    var userId = Session.user._id;

    console.log('this is scope object', $scope);

    $scope.createReview = function () {

        $http.post('/api/review/', { user: userId, comment: $scope.review.comment, rating: $scope.review.rating, film: $scope.film._id }).success(function (data) {
            console.log('Review created!');
            $state.go('orders');
        }).error(function (data) {
            console.log(data);
            console.log('Error creating review!');
        });
    };
});

app.factory('User', function ($state, $http) {
    return {
        get: function get() {
            return $http.get('/api/users').then(function (response) {
                return response.data;
            });
        }
    };
});

app.controller('UserCtrl', function ($scope, AuthService, $state, $http, User) {

    $scope.get = function () {
        User.get().then(function (users) {
            $scope.users = users;
        })['catch'](function (err) {
            console.log('error! :', err);
        });
    };

    $scope.get();
});
'use strict';
// Set up the state provider

app.config(function ($stateProvider) {
    $stateProvider.state('confirmation', {
        url: '/confirmation/:confirmationNumber',
        templateUrl: 'js/confirmation/confirmation.html',
        controller: 'ConfirmationCtrl',
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        },
        resolve: {}
    });
});

// Set up the Checkout controller

app.controller('ConfirmationCtrl', function ($scope, $http, $stateParams) {
    $scope.confirmationNumber = $stateParams.confirmationNumber;
    console.log($stateParams.confirmationNumber);
});
'use strict';
app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});
'use strict';

'use strict';
app.directive('adminSidebar', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/admin/directives/admin-sidebar/admin-sidebar.html',
        link: function link(scope) {
            scope.items = [{ label: 'Products', state: 'admin.products' }, { label: 'Categories', state: 'admin.categories' }, { label: 'Orders', state: 'admin.orders' }, { label: 'Users', state: 'admin.users' }];
        }
    };
});
'use strict';
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'All Films', state: 'films' }, { label: 'Cart', state: 'cart' }, { label: 'Orders', state: 'orders', auth: true }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            scope.isAdmin = function () {
                return AuthService.getAdminStatus();
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});
'use strict';
app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
'use strict';
app.directive('noneFound', function () {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/none-found/nonefound.html',
        link: function link(scope) {
            scope.errormsg = 'Dang. No Movies.';
        }
    };
});

//        address_country: 'blah'

// params: {key: val}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFkbWluL2FkbWluLmpzIiwiY2FydC9jYXJ0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJmaWxtcy9DYXRlZ29yeUZhY3RvcnkuanMiLCJmaWxtcy9GaWxtRmFjdG9yeS5qcyIsImZpbG1zL0ZpbG1VSS5qcyIsImZzYS9mc2EtcHJlLWJ1aWx0LmpzIiwibmV3LXVzZXIvbmV3LXVzZXIuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm9yZGVycy9vcmRlcnMuanMiLCJwZHAvcGRwLmpzIiwicmV2aWV3cy9SZXZpZXdGYWN0b3J5LmpzIiwidXNlcnMvdXNlcnMuanMiLCJjb25maXJtYXRpb24vY29uZmlybWF0aW9uLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1NvY2tldC5qcyIsImFkbWluL2RpcmVjdGl2ZXMvYWRtaW4tc2lkZWJhci9hZG1pbi1zaWRlYmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbm9uZS1mb3VuZC9ub25lZm91bmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBQSxDQUFBO0FBQ0EsSUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsYUFBQSxFQUFBLFNBQUEsRUFBQSxlQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEscUJBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7OztBQUdBLEdBQUEs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QUFBO0FBQ0Esa0JBQUEsRUFBQSxTQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLHVCQUFBLElBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGtCQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsYUFBQTtBQUNBLG1CQUFBLEVBQUEsb0NBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLG1CQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsaUJBQUE7QUFDQSxtQkFBQSxFQUFBLHNDQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUNBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEsK0JBQUE7QUFDQSxrQkFBQSxFQUFBLFVBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsUUFBQSxPQUFBLEdBQUEsbUJBQUE7QUFDQSxtQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsV0FBQSxFQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDckVBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLE9BQUE7QUFDQSxtQkFBQSxFQUFBLG1CQUFBO0FBQ0Esa0JBQUEsRUFBQSxVQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxrQkFBQSxXQUFBLEVBQUE7QUFDQSx1QkFBQSxXQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOzs7O0FBSUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLFFBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsYUFBQSxpQkFBQSxDQUFBLGtCQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxhQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLEdBQUEsa0JBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQSxFQUFBLEVBQUE7QUFDQSxnQkFBQSxXQUFBLEdBQUEsa0JBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLElBQUEsV0FBQSxDQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQTtTQUNBO0FBQ0EsZUFBQSxRQUFBLENBQUE7S0FDQTs7QUFFQSxVQUFBLENBQUEsa0JBQUEsR0FBQSxRQUFBLENBQUEsU0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxrQkFBQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGNBQUEsR0FBQSxVQUFBLGVBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxRQUFBLEdBQUEsZUFBQSxDQUFBO0FBQ0EsYUFBQSxDQUFBLEdBQUEsQ0FBQSwwQkFBQSxFQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxlQUFBLEVBQUEsZUFBQSxFQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxtQ0FBQSxFQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBLGlCQUFBLENBQUEsTUFBQSxDQUFBLGtCQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxrQkFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxNQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLGFBQUEsQ0FBQSxHQUFBLENBQUEsc0JBQUEsRUFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsQ0FBQSxDQUNBLE9BQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsa0JBQUEsR0FBQSxRQUFBLENBQUEsU0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEseUJBQUEsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxRQUFBLEdBQUEsaUJBQUEsQ0FBQSxNQUFBLENBQUEsa0JBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUNBLEtBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLGdDQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7Ozs7QUFJQSxHQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGVBQUEsRUFBQSxtQkFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsYUFBQSxFQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGlCQUFBLEVBQUEsbUJBQUEsR0FBQSxFQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBLEdBQUEsSUFBQSxZQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxJQUFBLENBQUEsV0FBQSxFQUFBLEVBQUEsTUFBQSxFQUFBLEVBQUEsRUFBQSxDQUFBLENBQ0EsT0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLDJCQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7OztBQUlBLEdBQUEsQ0FBQSxNQUFBLENBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxhQUFBLEdBQUEsR0FBQSxDQUFBLENBQUEsT0FBQSxDQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUN0RkEsWUFBQSxDQUFBOzs7QUFHQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLDJCQUFBO0FBQ0Esa0JBQUEsRUFBQSxjQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxrQkFBQSxXQUFBLEVBQUE7QUFDQSx1QkFBQSxXQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7YUFDQTtTQUNBOzs7QUFHQSxZQUFBLEVBQUE7QUFDQSx3QkFBQSxFQUFBLElBQUE7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFHQSxHQUFBLENBQUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUE7Ozs7QUFJQSxRQUFBLFNBQUEsR0FBQSxRQUFBLENBQUEsU0FBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsZUFBQSxFQUFBLFNBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxRQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7O0tBRUEsQ0FBQTs7QUFHQSxhQUFBLGNBQUEsQ0FBQSxrQkFBQSxFQUFBO0FBQ0EsWUFBQSxLQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsYUFBQSxJQUFBLENBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLGtCQUFBLENBQUEsTUFBQSxFQUFBLENBQUEsRUFBQSxFQUFBO0FBQ0EsZ0JBQUEsV0FBQSxHQUFBLGtCQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxpQkFBQSxJQUFBLFdBQUEsQ0FBQSxRQUFBLEdBQUEsV0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUE7U0FDQTtBQUNBLGVBQUEsS0FBQSxDQUFBO0tBQ0E7O0FBRUEsVUFBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLElBQUEsQ0FBQSxlQUFBLEVBQUE7QUFDQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxDQUFBLEtBQUE7U0FDQSxDQUFBLENBQ0EsT0FBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQTs7O0FBR0Esa0JBQUEsQ0FBQSxJQUFBLENBQUEsV0FBQSxDQUVBO0FBQ0Esb0JBQUEsRUFBQSxNQUFBLENBQUEsT0FBQSxDQUFBLGNBQUE7QUFDQSxzQkFBQSxFQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsZ0JBQUE7QUFDQSxtQkFBQSxFQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsYUFBQTtBQUNBLHlCQUFBLEVBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxnQkFBQSxDQUFBLEtBQUE7QUFDQSx3QkFBQSxFQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsZ0JBQUEsQ0FBQSxJQUFBO0FBQ0Esb0JBQUEsRUFBQSxNQUFBLENBQUEsT0FBQSxDQUFBLGNBQUE7QUFDQSw2QkFBQSxFQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsTUFBQTs7QUFFQSw0QkFBQSxFQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsSUFBQTtBQUNBLDZCQUFBLEVBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBO0FBQ0EsMkJBQUEsRUFBQSxNQUFBLENBQUEsT0FBQSxDQUFBLEdBQUEsRUFFQSxFQUFBLHFCQUFBLENBQUEsQ0FBQTs7QUFHQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxpQ0FBQSxFQUFBLGtCQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLGNBQUEsRUFBQSxFQUFBLGtCQUFBLEVBQUEsa0JBQUEsRUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsdUJBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxrQkFBQSxHQUFBLFFBQUEsQ0FBQSxTQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLGNBQUEsQ0FBQSxNQUFBLENBQUEsa0JBQUEsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxPQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE9BQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7Ozs7Ozs7OztBQVVBLGFBQUEscUJBQUEsQ0FBQSxNQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxnQ0FBQSxDQUFBLENBQUE7OztBQUdBLFlBQUEsUUFBQSxDQUFBLEtBQUEsRUFBQTs7OztBQUlBLG1CQUFBLENBQUEsR0FBQSxDQUFBLDJDQUFBLENBQUEsQ0FBQTtTQUNBLE1BQUE7O0FBRUEsbUJBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTs7QUFFQSxnQkFBQSxLQUFBLEdBQUEsUUFBQSxDQUFBLEVBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSw0QkFBQSxDQUFBLENBQUE7OztBQUdBLGlCQUFBLENBQUEsSUFBQSxDQUFBLGNBQUEsRUFBQTtBQUNBLDJCQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLENBQUEsS0FBQTthQUNBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLFNBQ0EsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUVBO0tBQ0E7Q0FFQSxDQUFBLENBQUE7QUN6SUEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxxQkFBQSxFQUFBLHlCQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxpQkFBQSxFQUFBLEVBRUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLFdBQUEsRUFBQSxhQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxrQkFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsRUFDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQUE7QUFDQSxrQkFBQSxpQkFBQSxFQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLFVBQUEsQ0FBQSxrQkFBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsRUFBQSxFQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxFQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxHQUFBLEdBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDMUJBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsa0JBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQUE7O0FBRUEsc0JBQUEsRUFBQSxFQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUE7OztBQUFBLGFBR0EsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQTs7QUFFQSxnQkFBQSxFQUFBLGtCQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLE9BQUEsU0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBLEVBQUEsU0FBQSxDQUFBLENBQUE7O0FBRUEsZ0JBQUEsYUFBQSxHQUFBLEVBQUEsQ0FBQTs7Ozs7QUFLQSxnQkFBQSxDQUFBLEdBQUEsU0FBQSxDQUFBLE1BQUEsQ0FBQTs7QUFFQSxpQkFBQSxJQUFBLENBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsRUFBQTtBQUNBLG9CQUFBLFFBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSx3QkFBQSxDQUFBLEdBQUEsR0FBQSxTQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsS0FBQSxHQUFBLFNBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxRQUFBLENBQUE7QUFDQSw2QkFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBLFFBQUEsQ0FBQTthQUNBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsRUFBQSxhQUFBLENBQUEsQ0FBQTs7QUFFQSxxQkFBQSxNQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsZUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsWUFBQTtBQUNBLDJCQUFBLENBQUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO2lCQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsMkJBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0E7O0FBRUEsa0JBQUEsQ0FBQSxhQUFBLENBQUEsQ0FBQTtTQUdBOztBQUFBLEtBRUE7S0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNwREEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxRQUFBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQTtBQUNBLGtCQUFBLEVBQUEsV0FBQTs7QUFBQSxLQUVBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsZUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxRQUFBLEdBQUE7QUFDQSxZQUFBLEVBQUEsSUFBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLEdBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxlQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxVQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxlQUFBLGVBQUEsVUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsZUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsZUFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUNBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsYUFBQSxHQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLGFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLG9CQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFVBQUEsR0FBQSxvQkFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUNBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxhQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsYUFBQSxHQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsZUFBQSxXQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsYUFBQSxHQUFBLEdBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUN6REEsQ0FBQSxZQUFBOztBQUVBLGdCQUFBLENBQUE7OztBQUdBLFFBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBOztBQUVBLFFBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsU0FBQSxFQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBOztBQUVBLFlBQUEsTUFBQSxDQUFBOztBQUVBLFlBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLEdBQUEsRUFBQSxDQUFBLHVCQUFBLENBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxrQkFBQSxHQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLGVBQUEsTUFBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOzs7OztBQUtBLE9BQUEsQ0FBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsbUJBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0FBQ0Esc0JBQUEsRUFBQSxzQkFBQTtBQUNBLHdCQUFBLEVBQUEsd0JBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGdCQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxhQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO1NBQ0EsQ0FBQTtBQUNBLGVBQUE7QUFDQSx5QkFBQSxFQUFBLHVCQUFBLFFBQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQUFBLEVBQ0EsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTtTQUNBLENBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsY0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUE7YUFDQSxNQUNBO0FBQ0EsdUJBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUE7YUFDQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLGVBQUEsR0FBQSxZQUFBOzs7Ozs7QUFNQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBOzs7OztBQUtBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUNBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsT0FBQSxFQUFBLDRCQUFBLEVBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtBQUNBLDBCQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxhQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsaUJBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBO0tBRUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQTs7QUFFQSxZQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsRUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxFQUFBLENBQUE7QUNwSkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsV0FBQTtBQUNBLG1CQUFBLEVBQUEsMkJBQUE7QUFDQSxrQkFBQSxFQUFBLGFBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsVUFBQSxHQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsYUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOztBQUVBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGFBQUEsQ0FBQSxJQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsQ0FBQSxDQUNBLE9BQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLG1DQUFBLENBQUEsQ0FBQTs7OztBQUlBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLFVBQUEsQ0FBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLFVBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0Esc0JBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxrREFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbkNBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsbUJBQUE7QUFDQSxrQkFBQSxFQUFBLFVBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLGVBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7O0FBRUEsbUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSxlQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxFQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FBSUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxrQkFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsRUFBQSxFQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDdENBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLHFCQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLFNBQUEsRUFBQTs7QUFFQSxjQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLFVBQUEsQ0FBQSxhQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzNCQSxZQUFBLENBQUE7OztBQUdBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUE7QUFDQSxZQUFBLEVBQUE7QUFDQSx3QkFBQSxFQUFBLElBQUE7U0FDQTtBQUNBLGVBQUEsRUFBQTtBQUNBLHFCQUFBLEVBQUEsbUJBQUEsYUFBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLG9CQUFBLE1BQUEsR0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLHVCQUFBLGFBQUEsQ0FBQSxTQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOzs7O0FBSUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQUEsU0FBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxzQkFBQSxFQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxlQUFBLEVBQUEsU0FBQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGdCQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxXQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLElBQUEsR0FBQSxZQUFBLENBQUEsSUFBQSxDQUFBOzs7QUFJQSxVQUFBLENBQUEsa0JBQUEsR0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxZQUFBLE1BQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxFQUFBLEVBQUEsRUFBQSxFQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUEsUUFBQSxDQUFBLElBQUEsRUFBQSxDQUFBLENBQUE7S0FFQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOzs7O0FBSUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsaUJBQUEsRUFBQSxtQkFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxvQ0FBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxjQUFBLEdBQUEsTUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxRQUFBLEVBQUE7QUFDQSxnQkFBQSxNQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxHQUFBLE1BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLHlCQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSwwQkFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7Ozs7QUFJQSxHQUFBLENBQUEsTUFBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsYUFBQSxHQUFBLEdBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDM0VBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZ0JBQUE7QUFDQSxtQkFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxTQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0EsbUJBQUEsRUFBQSxpQkFBQSxZQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0EsdUJBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxXQUFBLEVBQUEsYUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLEdBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsV0FBQSxFQUFBLGFBQUEsSUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxlQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBO2FBQ0EsRUFDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxjQUFBLEVBQUEsZ0JBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsR0FBQSxHQUFBLEVBQUEsT0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBO2FBQ0EsRUFDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxrQkFBQSxpQkFBQSxHQUFBLEVBQUE7QUFDQSxpQkFBQSxVQUFBLENBQUEsZ0JBQUEsR0FBQSxHQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxHQUFBLEdBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUEsZUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxJQUFBLEdBQUEsT0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE9BQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSxJQUFBO0FBQ0EsbUJBQUEsRUFBQSxJQUFBO0FBQ0EsYUFBQSxFQUFBLElBQUE7QUFDQSxpQkFBQSxFQUFBLElBQUE7QUFDQSxhQUFBLEVBQUEsSUFBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsQ0FBQSxhQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxvQkFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxVQUFBLEdBQUEsb0JBQUEsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsb0JBQUEsQ0FBQTtTQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsYUFBQSxFQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGVBQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGVBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxHQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxJQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsRUFBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLE9BQUEsVUFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxhQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLFNBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQTs7OztDQUlBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLG1CQUFBLEVBQUEsWUFBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSw0QkFBQTs7QUFFQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUVBOztLQUVBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSwwQkFBQTs7QUFFQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUVBOztLQUVBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSx3QkFBQTs7QUFFQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUVBOztLQUVBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSx3QkFBQTs7QUFFQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUVBOztLQUVBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNuSkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsYUFBQTtBQUNBLG1CQUFBLEVBQUEsd0JBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxtQkFBQSxFQUFBLGlCQUFBLFlBQUEsRUFBQSxPQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0EsdUJBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLENBQUEsRUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUdBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxjQUFBLEdBQUEsTUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0Esb0JBQUEsRUFBQSx3QkFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsZUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFJQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLElBQUEsR0FBQSxPQUFBLENBQUE7O0FBRUEsUUFBQSxNQUFBLEdBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUE7O0FBRUEsV0FBQSxDQUFBLEdBQUEsQ0FBQSxzQkFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTs7QUFFQSxhQUFBLENBQUEsSUFBQSxDQUFBLGNBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUNBLE9BQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUNBLEtBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUN0REEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLFdBQUEsRUFBQSxlQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUdBLEdBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsR0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO1NBQ0EsQ0FBQSxTQUNBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ3hCQSxZQUFBLENBQUE7OztBQUdBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxjQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsbUNBQUE7QUFDQSxtQkFBQSxFQUFBLG1DQUFBO0FBQ0Esa0JBQUEsRUFBQSxrQkFBQTs7O0FBR0EsWUFBQSxFQUFBO0FBQ0Esd0JBQUEsRUFBQSxJQUFBO1NBQ0E7QUFDQSxlQUFBLEVBQUEsRUFFQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7OztBQUlBLEdBQUEsQ0FBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLGtCQUFBLEdBQUEsWUFBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxXQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsQ0FBQSxrQkFBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUN4QkEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7O0FBRUEsUUFBQSxrQkFBQSxHQUFBLDRCQUFBLEdBQUEsRUFBQTtBQUNBLGVBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFF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c0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLENBQUEsQ0FBQTtTQUVBOztLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNwREEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHlEQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ05BLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7O0FBRUEsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsZ0RBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLFFBQUEsR0FBQSxrQkFBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ0JhZEFzc01vdmllcycsIFsndWkucm91dGVyJywgJ2ZzYVByZUJ1aWx0JywgJ3BheW1lbnQnLCAnYW5ndWxhck1vbWVudCddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIGFkbWluIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0FkbWluID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYWRtaW47XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG5cbiAgICAgICAgLy8gbG9nIGNoYW5nZXMgaW4gc3RhdGVcbiAgICAgICAgJHJvb3RTY29wZS5wcmV2aW91c1N0YXRlID0gZnJvbVN0YXRlLm5hbWU7XG4gICAgICAgICRyb290U2NvcGUuY3VycmVudFN0YXRlID0gdG9TdGF0ZS5uYW1lO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnUHJldmlvdXMgc3RhdGU6Jyskcm9vdFNjb3BlLnByZXZpb3VzU3RhdGUpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnQ3VycmVudCBzdGF0ZTonKyRyb290U2NvcGUuY3VycmVudFN0YXRlKTtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkgJiYgIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0FkbWluKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQWRtaW4odG9TdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXIuYWRtaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYWRtaW4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluJywge1xuICAgICAgICB1cmw6ICcvYWRtaW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FkbWluL2FkbWluLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWRtaW5DdHJsJyxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYWRtaW46IHRydWVcbiAgICAgICAgfVxuICAgIH0pXG4gICAgICAuc3RhdGUoJ2FkbWluLndlbGNvbWUnLCB7XG4gICAgICAgIHVybDogJy93ZWxjb21lJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hZG1pbi90ZW1wbGF0ZXMvd2VsY29tZS5odG1sJ1xuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYWRtaW4ucHJvZHVjdHMnLCB7XG4gICAgICAgIHVybDogJy9wcm9kdWN0cycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vdGVtcGxhdGVzL3Byb2R1Y3RzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnZmlsbXNDdHJsJ1xuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYWRtaW4uZWRpdHByb2R1Y3QnLCB7XG4gICAgICAgIHVybDogJy9lZGl0LzpwaWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FkbWluL3RlbXBsYXRlcy9lZGl0LXByb2R1Y3QuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQZHBDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgIHBkcEluZm86IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFByb2R1Y3QpIHtcbiAgICAgICAgICAgICByZXR1cm4gUHJvZHVjdC5nZXQoJHN0YXRlUGFyYW1zLnBpZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhZG1pbi5hZGRwcm9kdWN0Jywge1xuICAgICAgICB1cmw6ICcvcHJvZHVjdHMvYWRkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hZG1pbi90ZW1wbGF0ZXMvYWRkLXByb2R1Y3QuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQZHBDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgIHBkcEluZm86IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYWRtaW4uY2F0ZWdvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2NhdGVnb3JpZXMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FkbWluL3RlbXBsYXRlcy9jYXRlZ29yaWVzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnZmlsbXNDdHJsJ1xuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYWRtaW4uYWRkY2F0ZWdvcnknLCB7XG4gICAgICAgIHVybDogJy9jYXRlZ29yaWVzL2FkZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vdGVtcGxhdGVzL2FkZC1jYXRlZ29yeS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2ZpbG1zQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FkbWluLnVzZXJzJywge1xuICAgICAgICB1cmw6ICcvdXNlcnMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FkbWluL3RlbXBsYXRlcy91c2Vycy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1VzZXJDdHJsJ1xuICAgICAgfSlcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWRtaW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UpIHtcbiAgJHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgIH0pO1xuICB9O1xuXG4gIHNldFVzZXIoKTtcblxufSk7XG5cbiIsIid1c2Ugc3RyaWN0Jztcbi8vIFNldCB1cCB0aGUgc3RhdGUgcHJvdmlkZXJcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjYXJ0Jywge1xuICAgXHRcdHVybDogJy9jYXJ0JyxcbiAgIFx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NhcnQvY2FydC5odG1sJyxcbiAgIFx0XHRjb250cm9sbGVyOiAnQ2FydEN0cmwnLFxuICAgXHRcdHJlc29sdmU6IHtcbiAgIFx0XHRcdGNhcnRJbmZvOiBmdW5jdGlvbiAoY2FydEZhY3RvcnkpIHtcbiAgIFx0XHRcdFx0cmV0dXJuIGNhcnRGYWN0b3J5LmdldENhcnQoKTtcbiAgIFx0XHRcdH1cbiAgIFx0XHR9XG4gICB9KTtcbn0pO1xuXG4vLyBTZXQgdXAgdGhlIENhcnQgQ29udHJvbGxlclxuXG5hcHAuY29udHJvbGxlcignQ2FydEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgY2FydEluZm8sIGNhcnRGYWN0b3J5KSB7XG5cblx0ZnVuY3Rpb24gY2FsY3VsYXRlU3VidG90YWwgKGFsbExpbmVJdGVtc0luQ2FydCkge1xuXHRcdHZhciBzdWJ0b3RhbCA9IDA7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhbGxMaW5lSXRlbXNJbkNhcnQubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBjdXJyZW50SXRlbSA9IGFsbExpbmVJdGVtc0luQ2FydFtpXTtcblx0XHRcdHN1YnRvdGFsICs9IChjdXJyZW50SXRlbS5xdWFudGl0eSAqIGN1cnJlbnRJdGVtLmZpbG0ucHJpY2UpO1xuXHRcdH1cblx0XHRyZXR1cm4gc3VidG90YWw7XG5cdH1cblxuXHQkc2NvcGUuYWxsTGluZUl0ZW1zSW5DYXJ0ID0gY2FydEluZm8ubGluZUl0ZW1zO1xuXHQkc2NvcGUuc3VidG90YWwgPSBjYWxjdWxhdGVTdWJ0b3RhbCgkc2NvcGUuYWxsTGluZUl0ZW1zSW5DYXJ0KTtcblxuXHQkc2NvcGUudXBkYXRlUXVhbnRpdHkgPSBmdW5jdGlvbih1cGRhdGVkUXVhbnRpdHksIGluZGV4KSB7XG5cdFx0JHNjb3BlLmFsbExpbmVJdGVtc0luQ2FydFtpbmRleF0ucXVhbnRpdHkgPSB1cGRhdGVkUXVhbnRpdHk7XG5cdFx0JGh0dHAucHV0KCcvYXBpL2NhcnQvdXBkYXRlUXVhbnRpdHknLCB7aW5kZXg6IGluZGV4LCB1cGRhdGVkUXVhbnRpdHk6IHVwZGF0ZWRRdWFudGl0eX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiVXBkYXRlZCB0aGUgcXVhbnRpdHkgaW4gdGhlIGNhcnQhXCIsIHJlc3BvbnNlLmRhdGEpO1xuXHRcdCAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHRcdCRzY29wZS5zdWJ0b3RhbCA9IGNhbGN1bGF0ZVN1YnRvdGFsKCRzY29wZS5hbGxMaW5lSXRlbXNJbkNhcnQpO1xuXHR9O1xuXHQvLyBGdW5jdGlvbiB0byBkZWxldGUgYW4gaXRlbSBmcm9tIHRoZSBjYXJ0XG5cblx0JHNjb3BlLnJlbW92ZUZpbG1Gcm9tQ2FydCA9IGZ1bmN0aW9uIChmaWxtKSB7XG5cdFx0dmFyIGZpbG1JZCA9IGZpbG0uX2lkO1xuXHRcdCRodHRwLnB1dCgnL2FwaS9jYXJ0L3JlbW92ZUl0ZW0nLCB7ZmlsbUlkOiBmaWxtSWR9KS5cblx0XHQgICAgc3VjY2VzcyhmdW5jdGlvbihjYXJ0SW5mbykge1xuXHRcdCAgICBcdCRzY29wZS5hbGxMaW5lSXRlbXNJbkNhcnQgPSBjYXJ0SW5mby5saW5lSXRlbXM7XG5cdFx0ICAgICAgICBjb25zb2xlLmxvZyhcIkl0ZW0gcmVtb3ZlZCBmcm9tIENhcnQhXCIpO1xuXHRcdFx0XHQkc2NvcGUuc3VidG90YWwgPSBjYWxjdWxhdGVTdWJ0b3RhbCgkc2NvcGUuYWxsTGluZUl0ZW1zSW5DYXJ0KTtcblx0XHQgICAgfSkuXG5cdFx0ICAgIGVycm9yKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHQgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgcmVtb3ZpbmcgaXRlbSBmcm9tIENhcnQhXCIpO1xuXHRcdCAgICB9KTtcblx0fVxuXG59KTtcblxuLy8gRmFjdG9yeSB0byBnZXQgYSBjYXJ0XG5cbmFwcC5mYWN0b3J5KCdjYXJ0RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcblx0cmV0dXJuIHtcblx0XHRnZXRDYXJ0OiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvY2FydCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiVGhlIGRhdGEgaXNcIiwgcmVzcG9uc2UuZGF0YSk7XG5cdFx0XHQgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KTtcblx0XHR9LFxuICAgIGFkZFRvQ2FydDogZnVuY3Rpb24gKHBpZCkge1xuICAgICAgdmFyIGlkID0gcGlkIHx8ICRzdGF0ZVBhcmFtcy5waWQ7IFxuICAgICAgJGh0dHAucG9zdCgnL2FwaS9jYXJ0Jywge2ZpbG1JZDogaWR9KS5cbiAgICAgIHN1Y2Nlc3MoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJJdGVtIGFkZGVkIHRvIGNhcnQhXCIpO1xuICAgICAgICAgICRzdGF0ZS5nbygnY2FydCcpO1xuICAgICAgfSkuXG4gICAgICBlcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIGFkZGluZyBpdGVtIHRvIGNhcnRcIik7XG4gICAgICB9KTtcbiAgICB9XG5cdH07XG59KTtcblxuLy8gRmlsdGVyIGZvciBjZW50cyAtPiBkb2xsYXJzXG5cbmFwcC5maWx0ZXIoXCJjZW50c1RvRG9sbGFyc1wiLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChhbW91bnRJbkNlbnRzKSB7XG5cdFx0cmV0dXJuIChhbW91bnRJbkNlbnRzLzEwMCkudG9GaXhlZCgyKTtcblx0fVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG4vLyBTZXQgdXAgdGhlIHN0YXRlIHByb3ZpZGVyXG5cbmFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hlY2tvdXQnLCB7XG4gICAgICAgIHVybDogJy9jaGVja291dCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDaGVja291dEN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBjYXJ0SW5mbzogZnVuY3Rpb24oY2FydEZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FydEZhY3RvcnkuZ2V0Q2FydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbnRyb2xsZXIoJ0NoZWNrb3V0Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCBGaWxtRmFjdG9yeSwgY2FydEluZm8sICRzdGF0ZSkge1xuXG5cdC8vIHZhciBwdXJjaGFzZXN0YXRzID0ge307XG5cblx0dmFyIGNhcnRJdGVtcyA9IGNhcnRJbmZvLmxpbmVJdGVtczsgXG5cdC8vIGNvbnNvbGUubG9nKFwiY2FydEl0ZW1zLUNoZWNrb3V0LXR5cGVcIiwgdHlwZW9mIGNhcnRJdGVtcyk7XG5cdC8vIGNvbnNvbGUubG9nKFwiY2FydEl0ZW1zOiBcIixjYXJ0SXRlbXMpO1xuXHQvLyB2YXIgbCA9IGNhcnRJdGVtcy5sZW5ndGg7XG5cdC8vIGNvbnNvbGUubG9nKFwibFwiLCBsKTtcblxuXHQvLyBmb3IodmFyIGk9MDsgaTxsOyBpKyspe1xuXHQvLyBcdHZhciBmaWxtc3RhdCA9IHt9XG5cdC8vIFx0ZmlsbXN0YXQuX2lkID0gcHVyY2hhc2VzW2ldLmZpbG0uX2lkO1xuXHQvLyBcdGZpbG1zdGF0LmNvdW50ID0gcHVyY2hhc2VzW2ldLnF1YW50aXR5XG5cdC8vIFx0cHVyY2hhc2VzdGF0c1tpXSA9IGZpbG1zdGF0XG5cdC8vIH1cblxuXHQvLyBjb25zb2xlLmxvZyh0eXBlb2YgcHVyY2hhc2VzdGF0cyk7XHRcdFxuXHQvLyBjb25zb2xlLmxvZyhcInB1cmNoYXNlc3RhdHM6IFwiLHB1cmNoYXNlc3RhdHMpO1xuXG5cdCRzY29wZS5wdXRTdGF0cyA9IGZ1bmN0aW9uICgpIHtcblx0XHRjb25zb2xlLmxvZyhcImNhcnRJdGVtcy0yOiBcIixjYXJ0SXRlbXMpO1xuXHRcdEZpbG1GYWN0b3J5LnB1dFN0YXRzKGNhcnRJdGVtcyk7XG5cdFx0Ly8gRmlsbUZhY3RvcnkucHV0U3RhdHMocHVyY2hhc2VzdGF0cyk7XG5cdH1cblxuXG4gICAgZnVuY3Rpb24gY2FsY3VsYXRlVG90YWwgKGFsbExpbmVJdGVtc0luQ2FydCkge1xuICAgICAgICB2YXIgdG90YWwgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbExpbmVJdGVtc0luQ2FydC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gYWxsTGluZUl0ZW1zSW5DYXJ0W2ldO1xuICAgICAgICAgICAgdG90YWwgKz0gKGN1cnJlbnRJdGVtLnF1YW50aXR5ICogY3VycmVudEl0ZW0uZmlsbS5wcmljZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvdGFsO1xuICAgIH1cblxuICAgICRzY29wZS5jaGVja291dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkaHR0cC5wb3N0KCcvYXBpL2NoZWNrb3V0Jywge1xuICAgICAgICAgICAgY2FydEluZm86IGNhcnRJbmZvLCB0b3RhbDogJHNjb3BlLnRvdGFsXG4gICAgICAgIH0pLlxuICAgICAgICBzdWNjZXNzKGZ1bmN0aW9uKGNvbmZpcm1hdGlvbk51bWJlcikge1xuXG4gICAgICAgICAgICAvLyBTdHJpcGUgVG9rZW4gQ3JlYXRpb25cbiAgICAgICAgICAgIFN0cmlwZS5jYXJkLmNyZWF0ZVRva2VuKFxuXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAkc2NvcGUuYmlsbGluZy5jcmVkaXRDYXJkTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyOiAkc2NvcGUuYmlsbGluZy5jcmVkaXRDYXJkTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICBjdmM6ICRzY29wZS5iaWxsaW5nLmNyZWRpdENhcmRDVkMsXG4gICAgICAgICAgICAgICAgICAgIGV4cF9tb250aDogJHNjb3BlLmJpbGxpbmcuY3JlZGl0RXhwaXJhdGlvbi5tb250aCxcbiAgICAgICAgICAgICAgICAgICAgZXhwX3llYXI6ICRzY29wZS5iaWxsaW5nLmNyZWRpdEV4cGlyYXRpb24ueWVhcixcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJHNjb3BlLmJpbGxpbmcuY3JlZGl0Q2FyZE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3NfbGluZTE6ICRzY29wZS5hZGRyZXNzLnN0cmVldCxcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgIGFkZHJlc3NfbGluZTI6ICcnLFxuICAgICAgICAgICAgICAgICAgICBhZGRyZXNzX2NpdHk6ICRzY29wZS5hZGRyZXNzLmNpdHksXG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3Nfc3RhdGU6ICRzY29wZS5hZGRyZXNzLnN0YXRlLFxuICAgICAgICAgICAgICAgICAgICBhZGRyZXNzX3ppcDogJHNjb3BlLmFkZHJlc3MuemlwLFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgYWRkcmVzc19jb3VudHJ5OiAnYmxhaCdcbiAgICAgICAgICAgICAgICB9LCBzdHJpcGVSZXNwb25zZUhhbmRsZXIpO1xuXG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiT3JkZXIgY3JlYXRlZCFcIik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRIRSBDT05GSVJNQVRJT04gTlVNQkVSIElTU1NTU1NcIiwgY29uZmlybWF0aW9uTnVtYmVyKTtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnY29uZmlybWF0aW9uJywge2NvbmZpcm1hdGlvbk51bWJlcjogY29uZmlybWF0aW9uTnVtYmVyfSk7XG4gICAgICAgIH0pLlxuICAgICAgICBlcnJvcihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIGNyZWF0aW5nIG9yZGVyIVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuYWxsTGluZUl0ZW1zSW5DYXJ0ID0gY2FydEluZm8ubGluZUl0ZW1zO1xuICAgICRzY29wZS50b3RhbCA9IGNhbGN1bGF0ZVRvdGFsKCRzY29wZS5hbGxMaW5lSXRlbXNJbkNhcnQpO1xuXG4gICAgJHNjb3BlLmJpbGxpbmcgPSB7fTtcbiAgICAkc2NvcGUuYWRkcmVzcyA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAvLyBTdHJpcGUgVG9rZW4gQ3JlYXRpb25cbiAgICAvL1N0cmlwZS5jYXJkLmNyZWF0ZVRva2VuKCRmb3JtLCBzdHJpcGVSZXNwb25zZUhhbmRsZXIpO1xuXG4gICAgLy8gUHV0IHRoaXMgaW4gYSBzZXBhcmF0ZSBBUEkgZm9yICcvY2hhcmdlJyBhbmQgbWFrZSB0aGF0IGNhbGwgd2hlbiBoaXR0aW5nIHN1Ym1pdCBhcyB3ZWxsIG9yIG5lc3QgaW4gcG9zdCByZXF1ZXN0P1xuXG4gICAgLy8gVEVTVCBDQVJEIGZvciBTdHJpcGU6IDQwMTI4ODg4ODg4ODE4ODFcblxuICAgIC8vIFN0cmlwZSBSZXNwb25zZSBIYW5kbGVyXG4gICAgZnVuY3Rpb24gc3RyaXBlUmVzcG9uc2VIYW5kbGVyKHN0YXR1cywgcmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJHb3QgdG8gU3RyaXBlIFJlc3BvbnNlIEhhbmRsZXJcIik7XG4gICAgICAgIC8vICBcdHZhciAkZm9ybSA9ICQoJyNjaGVja291dC1mb3JtJyk7XG5cbiAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgICAgICAvLyBTaG93IHRoZSBlcnJvcnMgb24gdGhlIGZvcm1cbiAgICAgICAgICAgIC8vICRmb3JtLmZpbmQoJy5wYXltZW50LWVycm9ycycpLnRleHQocmVzcG9uc2UuZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAvLyAkZm9ybS5maW5kKCdidXR0b24nKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGhpcyBtZWFucyB0aGUgZm9ybSBwcm9iYWJseSBoYWQgYW4gZXJyb3JcIik7XG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidGhpcyBpcyB0b2tlbjpcIiwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgLy8gcmVzcG9uc2UgY29udGFpbnMgaWQgYW5kIGNhcmQsIHdoaWNoIGNvbnRhaW5zIGFkZGl0aW9uYWwgY2FyZCBkZXRhaWxzXG4gICAgICAgICAgICB2YXIgdG9rZW4gPSByZXNwb25zZS5pZDtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTdWJtaXR0ZWQgdGhlIHBheW1lbnQgZm9ybVwiKTtcblxuICAgICAgICAgICAgLy8gTWFrZSBzZXJ2ZXIgY2FsbCB0byBBUEkvY2hhcmdlXG4gICAgICAgICAgICAkaHR0cC5wb3N0KCcvYXBpL3BheW1lbnQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmlwZVRva2VuOiB0b2tlbiwgdG90YWw6ICRzY29wZS50b3RhbFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBheW1lbnQgU3VjY2Vzc2Z1bCFcIik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBheW1lbnQgRXJyb3IhXCIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfVxuXG59KTsiLCIndXNlIHN0cmljdCc7XG5hcHAuZmFjdG9yeSgnQ2F0ZWdvcnlGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUpIHtcblx0cmV0dXJuIHtcblx0XHRnZXRDYXRlZ29yaWVzOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9jYXRlZ29yaWVzJywgeyBcbiAgICAgICAgICAgICAgICAvLyBwYXJhbXM6IHtrZXk6IHZhbH1cbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9KTtcblx0XHR9LFxuICAgICAgICBhZGQ6IGZ1bmN0aW9uIChjYXRlZ29yeSkge1xuICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9jYXRlZ29yaWVzJywgY2F0ZWdvcnkpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FkbWluLmNhdGVnb3JpZXMnKTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgfSl9LCBcbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9jYXRlZ29yaWVzLycraWQpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJHN0YXRlLmN1cnJlbnQsIHt9LCB7cmVsb2FkOiB0cnVlfSk7XG4gICAgICAgIH0sIFxuICAgICAgICBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yOlwiK2Vycik7XG4gICAgICAgIH0pfVxuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5hcHAuZmFjdG9yeSgnRmlsbUZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0cmV0dXJuIHtcblx0XHRnZXRGaWxtczogZnVuY3Rpb24oY2F0ZWdvcnkpe1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9maWxtcycsIHsgXG4gICAgICAgICAgICAgICAgLy8gcGFyYW1zOiB7Y2F0ZWdvcmllczogXCI1NTMyYzE4YTBkYWQ1ODI3YWIyNGFmNDlcIn1cbiAgICAgICAgICAgICAgICBwYXJhbXM6IHtjYXRlZ29yaWVzOiBjYXRlZ29yeX1cbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlBBUkFNUzpcIixwYXJhbXMpO1xuICAgICAgICAgICAgICAgIC8vIHBhcmFtczoge3RpdGxlOiBcIlRoZSBNYXRyaXhcIn0gIFxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIH0pO1xuXHRcdFxuICAgICAgICB9LCAvL2Nsb3NlIGdldEZpbG1zIG1ldGhvZFxuXG4gICAgICAgIHB1dFN0YXRzOiBmdW5jdGlvbihjYXJ0SXRlbXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHR5cGVvZiBjYXJ0SXRlbXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjYXJ0SXRlbXM6IFwiLGNhcnRJdGVtcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwdXJjaGFzZXN0YXRzID0ge307XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHZhciBwdXJjaGFzZXMgPSBjYXJ0SXRlbXM7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwicHVyY2hhc2VzOiBcIixwdXJjaGFzZXMpO1xuICAgICAgICAgICAgdmFyIGwgPSBjYXJ0SXRlbXMubGVuZ3RoO1xuXG4gICAgICAgICAgICBmb3IodmFyIGk9MDsgaTxsOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBmaWxtc3RhdCA9IHt9XG4gICAgICAgICAgICAgICAgZmlsbXN0YXQuX2lkID0gY2FydEl0ZW1zW2ldLmZpbG0uX2lkO1xuICAgICAgICAgICAgICAgIGZpbG1zdGF0LmNvdW50ID0gY2FydEl0ZW1zW2ldLnF1YW50aXR5XG4gICAgICAgICAgICAgICAgcHVyY2hhc2VzdGF0c1tpXSA9IGZpbG1zdGF0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInB1cmNoYXNlc3RhdHM6IFwiLHB1cmNoYXNlc3RhdHMpO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBwdXRfaXQodGhpbmd0b3B1dCl7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJwdXRfaXQgRklSRUQhXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidGhpbmd0b3B1dDogXCIsIHRoaW5ndG9wdXQpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvZmlsbXMnLCB0aGluZ3RvcHV0KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzJylcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHV0X2l0KHB1cmNoYXNlc3RhdHMpO1xuICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICB9IC8vIGNsb3NlIHB1dFN0YXRzIG1ldGhvZCAgICAgICBcblxuXHR9IC8vIGNsb3NlIHJldHVybmVkIEZpbG1GYWN0b3J5IG9iamVjdC5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZmlsbXMnLCB7XG4gICAgICAgIHVybDogJy9maWxtcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZmlsbXMvZmlsbXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdmaWxtc0N0cmwnXG4gICAgICAgIC8vIHJlc29sdmU6IGdldE1vdmllcygpXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2ZpbG1zQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEZpbG1GYWN0b3J5LCBDYXRlZ29yeUZhY3RvcnksIGNhcnRGYWN0b3J5KSB7XG4gICRzY29wZS5jYXRlZ29yeSA9IHtcbiAgICBuYW1lOiBudWxsXG4gIH07XG5cbiAgJHNjb3BlLmFkZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQ2F0ZWdvcnlGYWN0b3J5LmFkZCgkc2NvcGUuY2F0ZWdvcnkpO1xuICB9XG5cbiAgJHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiBDYXRlZ29yeUZhY3RvcnkuZGVsZXRlKGlkKTtcbiAgfVxuXG4gICRzY29wZS5nZXRNb3ZpZXMgPSBmdW5jdGlvbihmaWx0ZXIpe1xuICAgIEZpbG1GYWN0b3J5LmdldEZpbG1zKGZpbHRlcilcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGZpbG1zZnJvbXNlcnZlcil7XG4gICAgICAgICRzY29wZS5maWxtcyA9IGZpbG1zZnJvbXNlcnZlcjtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciEgOiBcIixlcnIpO1xuICAgICAgfSk7IFxuICB9OyAvLyBjbG9zZSBnZXRNb3ZpZXNcblxuICAkc2NvcGUuZ2V0TW92aWVzKCk7XG5cbiAgJHNjb3BlLmdldENhdGVnb3JpZXMgPSBmdW5jdGlvbigpe1xuICAgICAgQ2F0ZWdvcnlGYWN0b3J5LmdldENhdGVnb3JpZXMoKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjYXRlZ29yaWVzZnJvbXNlcnZlcil7XG4gICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSBjYXRlZ29yaWVzZnJvbXNlcnZlcjtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciEgOiBcIixlcnIpO1xuICAgICAgICB9KTsgXG4gICAgfSAvLyBjbG9zZSBnZXRDYXRlZ29yaWVzXG5cbiAgICAkc2NvcGUuZ2V0Q2F0ZWdvcmllcygpO1xuXG4gICAgJHNjb3BlLmFkZEZpbG1Ub0NhcnQgPSBmdW5jdGlvbiAocGlkKSB7XG4gICAgICByZXR1cm4gY2FydEZhY3RvcnkuYWRkVG9DYXJ0KHBpZCk7XG4gICAgfVxuICAgIFxufSk7IC8vIGVuZCBmaWxtc0N0cmxcblxuYXBwLmZpbHRlcihcImNlbnRzVG9Eb2xsYXJzXCIsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGFtb3VudEluQ2VudHMpIHtcbiAgICByZXR1cm4gKGFtb3VudEluQ2VudHMvMTAwKS50b0ZpeGVkKDIpO1xuICB9XG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCRsb2NhdGlvbikge1xuXG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG5cbiAgICAgICAgdmFyIHNvY2tldDtcblxuICAgICAgICBpZiAoJGxvY2F0aW9uLiQkcG9ydCkge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJy8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb2NrZXQ7XG5cbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFkbWluU3RhdHVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFTZXNzaW9uLnVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBTZXNzaW9uLnVzZXIuYWRtaW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCduZXctdXNlcicsIHtcblx0XHR1cmw6ICcvbmV3LXVzZXInLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvbmV3LXVzZXIvbmV3LXVzZXIuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ05ld1VzZXJDdHJsJ1xuXHR9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignTmV3VXNlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlLCAkaHR0cCkge1xuXG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcbiAgICAkc2NvcGUubmV3QWNjb3VudCA9IHt9O1xuXG4gICAgJHNjb3BlLmNyZWF0ZUFjY291bnQgPSBmdW5jdGlvbiAobmV3QWNjb3VudCkge1xuXG4gICAgXHQkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgXHQkaHR0cC5wb3N0KCcvYXBpL25ldy11c2VyJywgbmV3QWNjb3VudCkuXG4gICAgXHRcdHN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgIFx0XHRcdGNvbnNvbGUubG9nKFwiTmV3IHVzZXIgc3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWQhXCIpO1xuXG4gICAgICAgICAgICAgICAgLy9BdXRvbWF0aWNhbGx5IGxvZyBpbiBhZnRlciBjcmVhdGluZyBhIG5ldyBhY2NvdW50XG5cbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dpbih7ZW1haWw6IG5ld0FjY291bnQuZW1haWwsIHBhc3N3b3JkOiBuZXdBY2NvdW50LnBhc3N3b3JkfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcdFx0fSkuXG4gICAgXHRcdGVycm9yKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBcdFx0XHRjb25zb2xlLmxvZyhcIlNvbWUgZXJyb3Igb2NjdXJyZWQgZHVyaW5nIGFjY291bnQgcmVnaXN0cmF0aW9uLlwiKTtcbiAgICBcdFx0fSk7XG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2hvbWVDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgSG9tZUZhY3RvcnksIENhdGVnb3J5RmFjdG9yeSkge1xuXG5cdCRzY29wZS5nZXRUb3AgPSBmdW5jdGlvbigpe1xuXG5cdFx0SG9tZUZhY3RvcnkuZ2V0RmlsbXMoKVxuXHRcdC50aGVuKGZ1bmN0aW9uKGZpbG1zZnJvbXNlcnZlcil7XG5cdFx0JHNjb3BlLmZpbG1zID0gZmlsbXNmcm9tc2VydmVyO1xuXHRcdGNvbnNvbGUubG9nKFwiJHNjb3BlLmZpbG1zOiBcIiwkc2NvcGUuZmlsbXMpO1xuXHRcdH0pXG5cdFx0LmNhdGNoKGZ1bmN0aW9uKGVycil7XG5cdFx0Y29uc29sZS5sb2coXCJlcnJvciEgOiBcIixlcnIpO1xuXHRcdH0pOyBcblx0fTtcblxuXHQkc2NvcGUuZ2V0VG9wKCk7XG5cbn0pO1xuXG5cblxuYXBwLmZhY3RvcnkoJ0hvbWVGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHJldHVybiB7XG5cdFx0Z2V0RmlsbXM6IGZ1bmN0aW9uKGNhdGVnb3J5KXtcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvaG9tZScsIHt9KVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBcdHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgXHR9KTtcblx0XHR9XG5cdH1cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSwgJHJvb3RTY29wZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCRyb290U2NvcGUucHJldmlvdXNTdGF0ZSk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBTZXQgdXAgdGhlIHN0YXRlIHByb3ZpZGVyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnb3JkZXJzJywge1xuXHRcdHVybDogJy9vcmRlcnMnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvb3JkZXJzL29yZGVycy5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnT3JkZXJzQ3RybCcsXG5cdFx0ZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgfSwgXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0XHRvcmRlckluZm86IGZ1bmN0aW9uIChvcmRlcnNGYWN0b3J5LCBTZXNzaW9uKSB7XG5cdFx0XHRcdHZhciB1c2VySWQgPSBTZXNzaW9uLnVzZXIuX2lkO1xuXHRcdFx0XHRyZXR1cm4gb3JkZXJzRmFjdG9yeS5nZXRPcmRlcnModXNlcklkKTtcblx0XHRcdFx0fVxuXHRcdH1cblx0fSlcblxufSk7XG5cbi8vIFNldCB1cCB0aGUgT3JkZXIgY29udHJvbGxlclxuXG5hcHAuY29udHJvbGxlcignT3JkZXJzQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgJGh0dHAsICRzdGF0ZVBhcmFtcywgb3JkZXJJbmZvKSB7XG4gICAgY29uc29sZS5sb2coXCJUaGlzIGlzIHN0YXRlcGFyYW1zOlwiLCAkc3RhdGVQYXJhbXMpO1xuXHRjb25zb2xlLmxvZyhcIk9SREVSIElORk8gSVNcIiwgb3JkZXJJbmZvKTtcblxuXHQkc2NvcGUuYWxsT3JkZXJzRm9yVXNlciA9IG9yZGVySW5mbztcblx0JHNjb3BlLmhlbGxvID0gXCJJVCBXT1JLRURcIjtcblxuXHQkc2NvcGUuZmlsbSA9ICRzdGF0ZVBhcmFtcy5maWxtO1xuXG5cbi8vXHRSZXZpZXcgZmlsbSBuYXZpZ2F0aW9uXG5cdCRzY29wZS53cml0ZVJldmlld0ZvckZpbG0gPSBmdW5jdGlvbihsaW5lSXRlbSl7XG5cdFx0Y29uc29sZS5sb2cobGluZUl0ZW0pO1xuXHRcdHZhciBmaWxtaWQgPSBsaW5lSXRlbS5maWxtLl9pZDtcblx0XHQkc3RhdGUuZ28oJ3JldmlldycsIHtpZDogZmlsbWlkLCBmaWxtOiBsaW5lSXRlbS5maWxtfSk7XG5cblx0fTtcblxufSk7XG5cbi8vIEZhY3RvcnkgdG8gcmV0cmlldmUgYW4gb3JkZXIgZnJvbSB0aGUgZGF0YWJhc2VcblxuYXBwLmZhY3RvcnkoJ29yZGVyc0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0cmV0dXJuIHtcblx0XHRnZXRPcmRlcnM6IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJUUllJTkcgVE8gR0VUIE9SREVSUyBXSVRIIFVTRVJJRDogXCIsIHVzZXJJZCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVycy8nK3VzZXJJZCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0fSxcblx0XHRnZXRGaWxtTmFtZTogZnVuY3Rpb24obGluZUl0ZW0pe1xuXHRcdFx0XHRcdFx0dmFyIGZpbG1pZCA9IGxpbmVJdGVtLmZpbG0uX2lkO1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCcvYXBpL3Byb2R1Y3RzLycrZmlsbWlkKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcInRoaXMgaXMgcmVzcG9uc2Ugb2JqZWN0XCIpO1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHRcdCRzY29wZS5maWxtID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJ0aGlzIGlzIHRoZSBzY29wZSBvYmplY3RcIik7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCRzY29wZSk7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiZmlsbS50aXRsZVwiKTtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJHNjb3BlLmZpbG0udGl0bGUpO1xuICAgICAgICAgICAgICAgIFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG4vLyBGaWx0ZXIgZm9yIGNlbnRzIC0+IGRvbGxhcnNcblxuYXBwLmZpbHRlcihcImNlbnRzVG9Eb2xsYXJzXCIsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24gKGFtb3VudEluQ2VudHMpIHtcblx0XHRyZXR1cm4gKGFtb3VudEluQ2VudHMvMTAwKS50b0ZpeGVkKDIpO1xuXHR9XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BkcCcsIHtcbiAgICAgICAgdXJsOiAnL3Byb2R1Y3RzLzpwaWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3BkcC9wZHAuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQZHBDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgcGRwSW5mbzogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgUHJvZHVjdCkge1xuICAgICAgICAgICAgICAgcmV0dXJuIFByb2R1Y3QuZ2V0KCRzdGF0ZVBhcmFtcy5waWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmZhY3RvcnkoJ1Byb2R1Y3QnLCBmdW5jdGlvbiAoJHN0YXRlLCAkaHR0cCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKHBpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cy8nK3BpZCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBhZGQ6IGZ1bmN0aW9uIChmaWxtKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9wcm9kdWN0cycsIGZpbG0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhZG1pbi5wcm9kdWN0cycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKHBpZCwgbmV3RGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnB1dCgnL2FwaS9wcm9kdWN0cy8nK3BpZCwgbmV3RGF0YSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2FkbWluLnByb2R1Y3RzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAocGlkKSB7XG4gICAgICAgICAgICAkaHR0cC5kZWxldGUoJy9hcGkvcHJvZHVjdHMvJytwaWQpLnN1Y2Nlc3MoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhZG1pbi5wcm9kdWN0cycpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvcjpcIitlcnIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1BkcEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIHBkcEluZm8sIFByb2R1Y3QsIENhdGVnb3J5RmFjdG9yeSwgY2FydEZhY3RvcnkpIHtcbiAgJHNjb3BlLmZpbG0gPSBwZHBJbmZvO1xuICAkc2NvcGUuZm9ybURhdGEgPSAkc2NvcGUuZmlsbTtcbiAgJHNjb3BlLm5ld0RhdGEgPSB7XG4gICAgdGl0bGU6IG51bGwsIFxuICAgIGRlc2NyaXB0aW9uOiBudWxsLFxuICAgIHByaWNlOiBudWxsLFxuICAgIGludmVudG9yeTogbnVsbCxcbiAgICBwaG90bzogbnVsbFxuICB9O1xuXG4gICAgJHNjb3BlLmdldENhdGVnb3JpZXMgPSBmdW5jdGlvbigpe1xuICAgICAgQ2F0ZWdvcnlGYWN0b3J5LmdldENhdGVnb3JpZXMoKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjYXRlZ29yaWVzZnJvbXNlcnZlcil7XG4gICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSBjYXRlZ29yaWVzZnJvbXNlcnZlcjtcbiAgICAgICAgICAvLyAkc2NvcGUuZm9ybURhdGEuY2F0ZWdvcmllcyA9IGNhdGVnb3JpZXNmcm9tc2VydmVyO1xuICAgICAgICAgICRzY29wZS5uZXdEYXRhLmNhdGVnb3JpZXMgPSBjYXRlZ29yaWVzZnJvbXNlcnZlcjtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciEgOiBcIixlcnIpO1xuICAgICAgICB9KTsgXG4gICAgfSAvLyBjbG9zZSBnZXRDYXRlZ29yaWVzXG5cbiAgICAkc2NvcGUuZ2V0Q2F0ZWdvcmllcygpO1xuXG4gICRzY29wZS5jbGVhbkNhdGVnb3JpZXMgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gICRzY29wZS5hZGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFByb2R1Y3QuYWRkKCRzY29wZS5uZXdEYXRhKTtcbiAgfVxuXG4gICRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBQcm9kdWN0LnVwZGF0ZSgkc2NvcGUuZmlsbS5faWQsICRzY29wZS5mb3JtRGF0YSk7XG4gIH1cblxuICAkc2NvcGUuZGVsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBQcm9kdWN0LmRlbGV0ZSgkc2NvcGUuZmlsbS5faWQpO1xuICB9XG5cbiAgJHNjb3BlLmFkZEZpbG1Ub0NhcnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gY2FydEZhY3RvcnkuYWRkVG9DYXJ0KCk7IFxuICB9O1xuXG4gIC8vIHJldHJpZXZlIGNhdGVnb3J5IG5hbWVzIGZyb20gb2JqZWN0IGlkcyBsYXRlclxuLy8gICRzY29wZS5jYXRlZ29yaWVzID0gZ2V0Q2F0ZWdvcmllcygkc2NvcGUuZmlsbS5jYXRlZ29yaWVzKTtcbn0pO1xuXG5hcHAuZGlyZWN0aXZlKCdwcm9kdWN0RGV0YWlsc0JveCcsIGZ1bmN0aW9uKCl7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3BkcC9wcm9kdWN0ZGV0YWlscy5odG1sJyxcbiAgICAgICAgXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbCwgYXR0cil7XG5cbiAgICAgICAgfVxuXG59O1xufSk7XG5cbmFwcC5kaXJlY3RpdmUoJ3Byb2R1Y3RJbWFnZScsIGZ1bmN0aW9uKCl7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3BkcC9wcm9kdWN0aW1hZ2UuaHRtbCcsXG4gICAgICAgIFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWwsIGF0dHIpe1xuXG4gICAgICAgIH1cblxufTtcbn0pO1xuXG5hcHAuZGlyZWN0aXZlKCdmaWxtUmV2aWV3JywgZnVuY3Rpb24oKXtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcGRwL2ZpbG1yZXZpZXcuaHRtbCcsXG4gICAgICAgIFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWwsIGF0dHIpe1xuXG4gICAgICAgIH1cblxufTtcbn0pO1xuXG5hcHAuZGlyZWN0aXZlKCdmaWxtUmF0aW5nJywgZnVuY3Rpb24oKXtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcGRwL2ZpbG1yYXRpbmcuaHRtbCcsXG4gICAgICAgIFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWwsIGF0dHIpe1xuXG4gICAgICAgIH1cblxuICAgIH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3JldmlldycsIHtcbiAgICAgICAgdXJsOiAnL3Jldmlldy86aWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Jldmlld3MvcmV2aWV3Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnUmV2aWV3Q3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgIHBkcEluZm86IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFByb2R1Y3QsIFNlc3Npb24pIHtcbiAgICAgICAgICAgICAgIHJldHVybiBQcm9kdWN0LmdldCgkc3RhdGVQYXJhbXMuaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuXG5hcHAuZmFjdG9yeSgnUmV2aWV3RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0UmV2aWV3czogZnVuY3Rpb24oZmlsbWlkKXtcbiAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCdhcGkvcmV2aWV3cy8nK2ZpbG1pZCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlUmV2aWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9yZXZpZXdzLycpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuXG5cbmFwcC5jb250cm9sbGVyKCdSZXZpZXdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBwZHBJbmZvLCBTZXNzaW9uKSB7XG4gICRzY29wZS5maWxtID0gcGRwSW5mbzsgXG5cbiAgdmFyIHVzZXJJZCA9IFNlc3Npb24udXNlci5faWQ7XG5cbiAgY29uc29sZS5sb2coXCJ0aGlzIGlzIHNjb3BlIG9iamVjdFwiLCAkc2NvcGUpO1xuXG5cbiAgJHNjb3BlLmNyZWF0ZVJldmlldyA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdCRodHRwLnBvc3QoJy9hcGkvcmV2aWV3LycsIHt1c2VyOiB1c2VySWQsIGNvbW1lbnQ6ICRzY29wZS5yZXZpZXcuY29tbWVudCwgcmF0aW5nOiAkc2NvcGUucmV2aWV3LnJhdGluZywgZmlsbTogJHNjb3BlLmZpbG0uX2lkfSkuXG5cdFx0XHRzdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdCAgICBjb25zb2xlLmxvZyhcIlJldmlldyBjcmVhdGVkIVwiKTtcblx0XHRcdCAgICAkc3RhdGUuZ28oJ29yZGVycycpO1xuXHRcdFx0fSkuXG5cdFx0XHRlcnJvcihmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xuXHRcdFx0ICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgY3JlYXRpbmcgcmV2aWV3IVwiKTtcblx0XHRcdH0pO1xuXHR9O1xuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdVc2VyJywgZnVuY3Rpb24gKCRzdGF0ZSwgJGh0dHApIHtcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlcnMnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgIH0pXG4gICAgfVxuICB9XG59KTtcblxuXG5hcHAuY29udHJvbGxlcignVXNlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlLCAkaHR0cCwgVXNlcikge1xuXG4gICRzY29wZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgVXNlci5nZXQoKS50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuICAgICAgJHNjb3BlLnVzZXJzID0gdXNlcnM7XG4gICAgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ2Vycm9yISA6JywgZXJyKTtcbiAgICB9KVxuICB9O1xuXG4gICRzY29wZS5nZXQoKTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuLy8gU2V0IHVwIHRoZSBzdGF0ZSBwcm92aWRlclxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29uZmlybWF0aW9uJywge1xuXHRcdHVybDogJy9jb25maXJtYXRpb24vOmNvbmZpcm1hdGlvbk51bWJlcicsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb25maXJtYXRpb24vY29uZmlybWF0aW9uLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdDb25maXJtYXRpb25DdHJsJyxcblx0XHQvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcblx0XHQvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG5cdFx0ZGF0YToge1xuXHRcdCAgICBhdXRoZW50aWNhdGU6IHRydWVcblx0XHR9LFxuXHRcdHJlc29sdmU6IHtcblxuXHRcdH1cblx0fSk7XG59KTtcblxuLy8gU2V0IHVwIHRoZSBDaGVja291dCBjb250cm9sbGVyXG5cbmFwcC5jb250cm9sbGVyKCdDb25maXJtYXRpb25DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsICRzdGF0ZVBhcmFtcykge1xuXHQkc2NvcGUuY29uZmlybWF0aW9uTnVtYmVyID0gJHN0YXRlUGFyYW1zLmNvbmZpcm1hdGlvbk51bWJlcjtcblx0Y29uc29sZS5sb2coJHN0YXRlUGFyYW1zLmNvbmZpcm1hdGlvbk51bWJlcik7XG59KTsiLCIndXNlIHN0cmljdCc7XG5hcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLidcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG4iLCIndXNlIHN0cmljdCc7XG5hcHAuZGlyZWN0aXZlKCdhZG1pblNpZGViYXInLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hZG1pbi9kaXJlY3RpdmVzL2FkbWluLXNpZGViYXIvYWRtaW4tc2lkZWJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICB7IGxhYmVsOiAnUHJvZHVjdHMnLCBzdGF0ZTogJ2FkbWluLnByb2R1Y3RzJyB9LFxuICAgICAgICAgICAgeyBsYWJlbDogJ0NhdGVnb3JpZXMnLCBzdGF0ZTogJ2FkbWluLmNhdGVnb3JpZXMnIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnT3JkZXJzJywgc3RhdGU6ICdhZG1pbi5vcmRlcnMnfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdVc2VycycsIHN0YXRlOiAnYWRtaW4udXNlcnMnfVxuICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBbGwgRmlsbXMnLCBzdGF0ZTogJ2ZpbG1zJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdDYXJ0Jywgc3RhdGU6ICdjYXJ0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdPcmRlcnMnLCBzdGF0ZTogJ29yZGVycycsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUuaXNBZG1pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0QWRtaW5TdGF0dXMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcbmFwcC5kaXJlY3RpdmUoJ25vbmVGb3VuZCcsIGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbm9uZS1mb3VuZC9ub25lZm91bmQuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZXJyb3Jtc2cgPSBcIkRhbmcuIE5vIE1vdmllcy5cIlxuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9