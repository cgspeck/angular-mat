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
    
    var canvas_colour = "LightGray";
    var canvas_padding = 10; // px

    function convert_unit(value, from_unit, to_unit) {
        $log.debug(from_unit);
        if (from_unit == to_unit) {
            return value;
        }
        // otherwise convert to mm
        var m_value = value;

        if (from_unit == "cm") {
            m_value = value * 10;
        }

        if (from_unit == "inches") {
            m_value = value * 25.4;
            $log.debug("converted from inches " + m_value);
        }

        if (to_unit == "mm") {
            return m_value;
        }

        if (to_unit == "cm") {
            return m_value / 10;
        }

        if (to_unit == "inches") {
            return m_value / 25.4
        }
    }

    function normaliseFigures() {
        $log.debug($scope['sheet_units']);
        var fields = ['sheet_width', 'sheet_height', 'image_width', 'image_height', 'options_horizontal_overlap', 'options_bottom_weight'];
        fields.map( function(item) {
            $scope['_' + item] = parseFloat(convert_unit($scope[item], $scope[item.split('_')[0] + "_units"], "mm"));
            $log.debug($scope['_' + item]);
        })
    }

    function calculateScale(canvas) {
        /* returns a multiplication factor so that the drawn sheet fits within
        the canvas within given padding */
        var avaliable_width = canvas.width - (2 * canvas_padding);
        var avaliable_height = canvas.height - (2 * canvas_padding);
        var height_difference = avaliable_height - $scope._sheet_height;
        var width_difference = avaliable_width - $scope._sheet_width;

        if (height_difference < 0 || width_difference < 0) {
            //sheet is larger than canvas, need to return a value < 1
            if (width_difference < height_difference) {
                //limit by avaliable width
                return (avaliable_width / $scope._sheet_width);
            } else {
                //limit by avaliable height
                return (avaliable_height / $scope._sheet_height);
            }
        } else {
            return 1;
            //enlarge/return a value > 1
        }
    }

    function clearCanvas(canvas) {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width,canvas.height);
    }

    function drawSheet(canvas) {
        //
        var scale = calculateScale(canvas);
        var avaliable_width = canvas.width - (2 * canvas_padding);
        var avaliable_height = canvas.height - (2 * canvas_padding);
        var calculated_width = $scope._sheet_width * scale;
        var calculated_height = $scope._sheet_height * scale;

        var left_offset = canvas_padding + ((avaliable_width - calculated_width) / 2);
        var top_offset = canvas_padding + ((avaliable_height - calculated_height) / 2);

        var ctx = canvas.getContext("2d");
        $log.debug(scale);
        $log.debug(avaliable_width);
        $log.debug(avaliable_height);
        $log.debug(left_offset);
        $log.debug(top_offset);
        $log.debug(calculated_width);
        $log.debug(calculated_height);

        ctx.rect(left_offset, top_offset, calculated_width, calculated_height);
        ctx.stroke();
        ctx.fillStyle="LightGoldenRodYellow";
        ctx.fill();
    }

    $scope.updateCanvas = function() {
        normaliseFigures();
        // make our canvasses as wide as they can be
        var results_div = document.getElementById('resultsDiv');

        ['front_canvas'].map( function(canvas_id) {
            $log.debug(canvas_id);
            var canvas = document.getElementById(canvas_id);
            canvas.width = results_div.offsetWidth;
            clearCanvas(canvas);
            drawSheet(canvas);
        });
        /*var canvas = document.getElementById('front_canvas');
        var ctx=canvas.getContext("2d");
        //      startx, starty, endx, endy
        ctx.rect(20,20,300,100);
        ctx.stroke();*/
    }

    //initalise the form
    $scope.updateCanvas();

  }])
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
