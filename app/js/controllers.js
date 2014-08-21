'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('matBoardCalculator', ['$scope', '$log', '$filter',
    function($scope, $log, $filter) {
    $scope.sheet_width = 400; // internally store values as metric mm
    $scope.sheet_height = 500; // internally store values as metric mm
    $scope.image_width = 200;
    $scope.image_height = 300;
    $scope.options_horizontal_overlap = 3; // mm
    $scope.options_bottom_weight = 25;

    $scope.options_units = "mm";
    $scope.image_units = "mm";
    $scope.sheet_units = "mm";

    $scope.canvasSupported = !!window.HTMLCanvasElement;
    
    var canvas_colour = "LightGray";
    var canvas_padding = 10; // px

    function convert_unit(value, from_unit, to_unit) {
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
        var fields = ['sheet_width', 'sheet_height', 'image_width', 'image_height', 'options_horizontal_overlap', 'options_bottom_weight'];
        fields.map( function(item) {
            $scope['_' + item] = parseFloat(convert_unit($scope[item], $scope[item.split('_')[0] + "_units"], "mm"));
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

    function draw(ctx){
        cxt.drawImage(img, left_image_offset, top_image_offset);
    };

    function drawSheetAndImage(canvas, canvas_id) {
        //
        if (!(canvas_id == "front_canvas" || canvas_id == "back_canvas")) {
            $log.error("Unrecognised canvas_id:" + canvas_id);
            return;
        }
        //set the background colour
        var ctx = canvas.getContext("2d");
        ctx.fillStyle   = canvas_colour; // set canvas background color
        ctx.fillRect  (0,   0, canvas.width, canvas.height);  // now fill the canvas

        var scale = calculateScale(canvas);
        var avaliable_width = canvas.width - (2 * canvas_padding);
        var avaliable_height = canvas.height - (2 * canvas_padding);
        var calculated_sheet_width = $scope._sheet_width * scale;
        var calculated_sheet_height = $scope._sheet_height * scale;

        var calculated_overlap = $scope._options_horizontal_overlap * scale;

        var left_sheet_offset = canvas_padding + ((avaliable_width - calculated_sheet_width) / 2);
        var top_sheet_offset = canvas_padding + ((avaliable_height - calculated_sheet_height) / 2);

        // drawing the sheet
        ctx.rect(left_sheet_offset, top_sheet_offset, calculated_sheet_width, calculated_sheet_height);
        ctx.lineWidth=3;
        ctx.strokeStyle="Black";
        ctx.stroke();
        ctx.fillStyle="LightGoldenRodYellow";
        ctx.fill();

        //calculate the position of the image or hole
        var calculated_image_width = $scope._image_width * scale;
        var calculated_image_height = $scope._image_height * scale;

        var left_image_offset = left_sheet_offset + ((calculated_sheet_width - calculated_image_width)/2) + calculated_overlap;
        var top_image_offset = top_sheet_offset + ((calculated_sheet_height - calculated_image_height)/2) + calculated_overlap;

        //take the bottom weighting into account
        top_image_offset = top_image_offset - ($scope._options_bottom_weight * scale);

        if (canvas_id == "front_canvas") {
            //now put a picture in
            var cxt = canvas.getContext("2d");
            // http://placekitten.com/g/200/300
            var img=new Image();
            img.src='http://placekitten.com/' + parseInt(calculated_image_width)  + '/' + parseInt(calculated_image_height);
            img.onload = function(ctx){
                cxt.drawImage(img, left_image_offset, top_image_offset,
                    calculated_image_width, calculated_image_height);
            };
            // TODO: need to mark where the gradient is
            ctx.lineWidth = calculated_overlap;
            ctx.strokeStyle = "OrangeRed";
            ctx.strokeRect(left_image_offset - calculated_overlap, 
                top_image_offset - calculated_overlap,
                calculated_image_width + (calculated_overlap * 2),
                calculated_image_height + (calculated_overlap * 2));
        } else {
            ctx.fillStyle = canvas_colour;
            ctx.fillRect(left_image_offset,
                top_image_offset,
                calculated_image_width,
                calculated_image_height);
        }
    }

    function calculateDistances() {
        // Bevel - front
        $scope._window_left_offset = ($scope._sheet_width - $scope._image_width) / 2;  //internally using mm
        $scope._window_top_offset = ($scope._sheet_height - $scope._image_height) / 2;  //internally using mm
        $scope._window_bottom_offset = $scope._window_top_offset;
        $scope._window_top_offset = $scope._window_top_offset - $scope._options_bottom_weight;
        $scope._window_bottom_offset = $scope._window_bottom_offset + $scope._options_bottom_weight;
        // Window - back
        $scope._bevel_left_offset = $scope._window_left_offset - $scope._options_horizontal_overlap;  //internally using mm
        $scope._bevel_top_offset = $scope._window_top_offset  - $scope._options_horizontal_overlap;  //internally using mm
        $scope._bevel_bottom_offset = $scope._window_bottom_offset  + $scope._options_horizontal_overlap;  //internally using mm

        //now convert to human friendly and selected format
        var fields = ['window_left_offset', 'window_top_offset', 'window_bottom_offset', 'bevel_left_offset', 'bevel_top_offset', 'bevel_bottom_offset'];
        fields.map( function(item) {
            var decimal_places = 0; // default for mm
            switch ($scope.options_units) {
                case "cm":
                    decimal_places = 2;
                    break;
                case "inches":
                    decimal_places = 2;
                    break;
            }
            $scope[item] = $filter('number')(convert_unit($scope['_' + item], "mm", $scope.options_units), decimal_places);
        })
    }

    $scope.updateCanvas = function() {
        // check if the form exists and break if invalid
        // form will not be defined the first time the screen loads
        if (angular.isDefined($scope.myForm)) {
            if ($scope.myForm.$invalid) {
                // TODO: display validation errors?
                return;
            }

        }
        //$log.debug($scope.myForm);
        normaliseFigures();

        if ($scope.canvasSupported) {
            // make our canvasses as wide as they can be
            var results_div = document.getElementById('previewDiv');
            // now draw on them
            ['front_canvas', 'back_canvas'].map( function(canvas_id) {
                var canvas = document.getElementById(canvas_id);
                canvas.width = results_div.offsetWidth;
                clearCanvas(canvas);
                drawSheetAndImage(canvas, canvas_id);
            });
        }
        calculateDistances();
    }

    //initalise the form
    $scope.updateCanvas();

  }])
