'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', ['$scope', '$log', function($scope, $log) {
    $scope.sheet_width = 400; // internally store values as metric mm
    $scope.sheet_height = 500; // internally store values as metric mm
    $scope.image_width = 190;
    $scope.image_height = 295;
    $scope.options_horizontal_overlap = 3; // mm
    $scope.options_bottom_weight = 25;

    $scope.options_units = "mm";
    $scope.image_units = "mm";
    $scope.sheet_units = "mm";

    function convert_unit(value, from_unit, to_unit) {
        if (from_unit == to_unit) {
            return value;
        }
        // otherwise convert to mm
        var m_value = value;

        if (from_unit == "cm") {
            m_value = value / 10;
        }

        if (from_unit == "inch") {
            m_value = value * 25.4;
        }

        if (to_unit == "mm") {
            return m_value;
        }

        if (to_unit == "cm") {
            return m_value * 10;
        }

        if (to_unit == "inch") {
            return m_value / 25.4
        }
    }

    function normaliseFigures() {
        var fields = ['sheet_width', 'sheet_height', 'image_width', 'image_height', 'options_horizontal_overlap', 'options_bottom_weight'];
        fields.map( function(item) {
            $scope['_' + item] = convert_unit($scope[item], $scope[item.split('_')[0] + "_units"], "mm")
            $log.debug($scope['_' + item]);
        })
    }

    $scope.updateCanvas = function() {
        normaliseFigures();
        var results_div = document.getElementById('resultsDiv');
        console.log("XXXX");
        console.log(results_div.offsetWidth);
        var canvas = document.getElementById('front_canvas');
        console.log(canvas);
        console.log(canvas.height);
        console.log(canvas.width);
        canvas.width = results_div.offsetWidth;
        var ctx=canvas.getContext("2d");
        ctx.rect(20,20,300,100);
        ctx.stroke();
    }

    //initalise the form
    $scope.updateCanvas();

  }])
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
