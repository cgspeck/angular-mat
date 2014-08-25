'use strict';

// Declare app level module which depends on filters, and services
var app = angular.module('myApp', [
  'ui.bootstrap',
  'ngRoute',
  'myApp.controllers',
])

ga('create', 'UA-16642385-2', 'auto');  // Creates a tracker.
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {templateUrl: 'partials/matBoardCalculator.html', controller: 'matBoardCalculator'});
  $routeProvider.otherwise({redirectTo: '/'});
}]);

app.run(["$rootScope", "$location", function ($rootScope, $location) {
    $rootScope.$on('$routeChangeSuccess', function(){
        ga('send', 'pageview', $location.path());
    });
}]);