'use strict';

// Declare app level module which depends on filters, and services
var app = angular.module('myApp', [
  'ui.bootstrap',
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers',
])

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {templateUrl: 'partials/matBoardCalculator.html', controller: 'matBoardCalculator'});
  $routeProvider.otherwise({redirectTo: '/'});
}]);
