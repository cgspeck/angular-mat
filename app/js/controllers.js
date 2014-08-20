'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', ['$scope', function($scope) {
    $scope.sheet_width = 300; // internally store values as metric mm
    $scope.sheet_height = 200; // internally store values as metric mm

  }])
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
