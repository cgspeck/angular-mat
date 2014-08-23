/*globals window, Image, document*/
'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('matBoardCalculator', ['$scope', '$log', '$filter',
    function($scope, $log, $filter) {
    $scope.sheet_width = 40; // internally store values as metric mm
    $scope.sheet_height = 40; // internally store values as metric mm
    $scope.page_width = 29.7;
    $scope.page_height = 21;
    $scope.image_width = 20;
    $scope.image_height = 20;
    //$scope.image_left_margin = 0;
    //$scope.image_top_margin = 0;
    $scope.options_overlap = 0.3; // mm
    $scope.options_bottom_weight = 2.5;

    $scope.options_units = "cm";
    $scope._options_units = "cm";
    $scope.image_units = "cm";
    $scope._image_units = "cm";
    $scope.sheet_units = "cm";
    $scope._sheet_units = "cm";
    $scope.page_units = "cm";
    $scope._page_units = "cm";

    // a dictionary binding unit selector to fields
    var selector_fields_map = {
        "options" : ["overlap", "bottom_weight"],
        "image": ["width", "height"],
        "sheet": ["width", "height"],
        "page": ["width", "height"]
    }

    $scope.sizeErrors = false;
    $scope.sizeErrorString = "";

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
            return m_value / 25.4;
        }
    }

    function normaliseFigures() {
        var fields = ['sheet_width', 'sheet_height', 'image_width',
            'image_height', 'options_overlap',
            'options_bottom_weight', 'page_height', 'page_width'];
        fields.map( function(item) {
            $scope['_' + item] = parseFloat(convert_unit($scope[item], $scope[item.split('_')[0] + "_units"], "mm"));
        });
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

        var avaliable_width = canvas.width - (2 * canvas_padding);
        var avaliable_height = canvas.height - (2 * canvas_padding);
        var scale = calculateScale(canvas);
        var calculated_sheet_width = $scope._sheet_width * scale;
        var calculated_sheet_height = $scope._sheet_height * scale;
        var left_sheet_offset = canvas_padding + ((avaliable_width - calculated_sheet_width) / 2);
        var top_sheet_offset = canvas_padding + ((avaliable_height - calculated_sheet_height) / 2);
        // drawing the mat board itself
        ctx.rect(left_sheet_offset, top_sheet_offset, calculated_sheet_width, calculated_sheet_height);
        ctx.lineWidth=3;
        ctx.strokeStyle="Black";
        ctx.stroke();
        ctx.fillStyle="LightGoldenRodYellow";
        ctx.fill(); 
        // now draw the paper sheet
        var calculated_page_width = $scope._page_width * scale;
        var calculated_page_height = $scope._page_height * scale;
        var calculated_page_left_offset = left_sheet_offset + ($scope._page_left_offset * scale);
        $log.debug($scope._page_left_offset);
        $log.debug(left_sheet_offset);
        var calculated_page_top_offset = top_sheet_offset + ($scope._page_top_offset * scale);

        ctx.fillStyle="White";
        ctx.fillRect(calculated_page_left_offset, calculated_page_top_offset,
            calculated_page_width, calculated_page_height);
        $log.debug(calculated_page_left_offset);

        // now draw the image
        var calculated_image_width = $scope._image_width * scale;
        var calculated_image_height = $scope._image_height * scale;

        var calculated_image_left_offset = calculated_page_left_offset + ($scope._image_left_margin * scale);
        var calculated_image_top_offset = calculated_page_top_offset + ($scope._image_top_margin * scale);
        
        
        var img=new Image();
        $log.debug("img:");
        $log.debug(img);
        img.src='http://placekitten.com/' + parseInt(calculated_image_width)  + '/' + parseInt(calculated_image_height);
        img.onload = function(){
            ctx.drawImage(img, calculated_image_left_offset, calculated_image_top_offset);
            if (canvas_id == "front_canvas") {
                ctx.fillStyle = "LightGoldenRodYellow";
                // left panel
                var calculated_panel_width = $scope._window_left_offset * scale;
                ctx.fillRect(left_sheet_offset, top_sheet_offset,
                    calculated_panel_width, calculated_sheet_height);
                // right panel
                var right_panel_offset = (calculated_sheet_width + left_sheet_offset) - calculated_panel_width;
                // /ctx.fillStyle = "LightGoldenRodYellow";
                ctx.fillRect(right_panel_offset, top_sheet_offset,
                    calculated_panel_width, calculated_sheet_height);
                // top
                var calculated_top_panel_height = $scope._window_top_offset * scale;
                ctx.fillRect(left_sheet_offset, top_sheet_offset,
                    calculated_sheet_width, calculated_top_panel_height);
                //bottom
                var calculated_bottom_panel_height = $scope._window_bottom_offset * scale;
                var calculated_bottom_panel_offset = (top_sheet_offset + calculated_sheet_height) - calculated_bottom_panel_height;
                ctx.fillRect(left_sheet_offset, calculated_bottom_panel_offset,
                    calculated_sheet_width, calculated_bottom_panel_height);
            }
        };
        

    }

    function calculateDistances() {
        // Window - for front mat
        $scope._window_left_offset = ($scope._sheet_width - $scope._image_width) / 2;  //internally using mm
        $scope._window_top_offset = ($scope._sheet_height - $scope._image_height) / 2;  //internally using mm
        $scope._window_bottom_offset = $scope._window_top_offset;
        $scope._window_top_offset = $scope._window_top_offset - $scope._options_bottom_weight;
        $scope._window_bottom_offset = $scope._window_bottom_offset + $scope._options_bottom_weight;

        ['_window_left_offset', '_window_top_offset', '_window_bottom_offset'].map( function(item) {
            $scope[item] = $scope[item] + $scope._options_overlap; // adjust for overlap
        });
        // Print - for back
        $scope._page_left_offset = ($scope._sheet_width - $scope._page_width) / 2;  //internally using mm
        $scope._page_top_offset = ($scope._sheet_height - $scope._page_height) / 2;  //internally using mm
        $scope._page_bottom_offset = $scope._page_top_offset + $scope._options_bottom_weight;
        $scope._page_top_offset = $scope._page_top_offset - $scope._options_bottom_weight;

        $scope._image_left_margin = ($scope._page_width - $scope._image_width) / 2;
        $scope._image_top_margin = ($scope._page_height - $scope._image_height) / 2;

        //now convert to human friendly and selected format
        var fields = ['window_left_offset', 'window_top_offset',
            'window_bottom_offset', 'page_left_offset', 'page_top_offset',
            'page_bottom_offset', 'image_left_margin', 'image_top_margin'];
        fields.map( function(item) {
            $scope[item] = $filter('number')(convert_unit($scope['_' + item], "mm", $scope.options_units), decimal_places($scope.options_units));
        });
    }

    function decimal_places(units){
        switch (units) {
            case "mm":
                return 0;
            case "cm":
                return 2;
            case "inches":
                return 2;
        }
    }

    function do_size_validations() {
        var ok = true;
        var msg = "";

        function lnbrk(msg) {
            return (msg.length == 0) ? "" : msg + "\n";
        }

        angular.element(document.getElementById("page_height")).removeClass("ng-invalid");
        angular.element(document.getElementById("image_height")).removeClass("ng-invalid");
        angular.element(document.getElementById("sheet_height")).removeClass("ng-invalid");
        angular.element(document.getElementById("image_width")).removeClass("ng-invalid");
        angular.element(document.getElementById("page_width")).removeClass("ng-invalid");
        angular.element(document.getElementById("sheet_width")).removeClass("ng-invalid");

        if ($scope._image_height > $scope._page_height) {
            ok = false;
            msg = "Image height must be less than page height.";
            document.getElementById("page_height").className += " ng-invalid";
            document.getElementById("image_height").className += " ng-invalid";
        }

        if ($scope._page_height > $scope._sheet_height) {
            ok = false;
            msg = lnbrk(msg) + "Page height must be less than mat height.";
            document.getElementById("page_height").className += " ng-invalid";
            document.getElementById("sheet_height").className += " ng-invalid";
        }

        if ($scope._image_width > $scope._page_width) {
            ok = false;
            msg = "Image width must be less than page width.";
            angular.element(document.getElementById("image_width")).addClass("ng-invalid");
            angular.element(document.getElementById("page_width")).addClass("ng-invalid");
        }

        if ($scope._page_width > $scope._sheet_width) {
            ok = false;
            msg = lnbrk(msg) + "Page width must be less than mat width.";
            angular.element(document.getElementById("sheet_width")).addClass("ng-invalid");
            angular.element(document.getElementById("page_width")).addClass("ng-invalid");
        }

        return {
            valid: ok,
            message: msg
        };
    }


    $scope.updateCanvas = function() {
        // check if the form exists and break if invalid
        // form will not be defined the first time the screen loads
        if (angular.isDefined($scope.myForm)) {
            if ($scope.myForm.$invalid) {
                // TODO: display validation errors?
                $log.debug('validation errors');
                $scope.sizeErrors = true;
                $scope.sizeErrorString = "One or more fields empty or invalid.";
                return;
            }

        }
        //$log.debug($scope.myForm);
        normaliseFigures();

        var size_validation = do_size_validations();
        $log.debug(size_validation);
        $log.debug(size_validation.valid);

        if (!size_validation.valid) {
            $scope.sizeErrors = true;
            $scope.sizeErrorString = size_validation.message;
            return;
        }

        $scope.sizeErrors = false;
        
        calculateDistances();

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
    };

    $scope.convertInputs = function(selector) {
        if (angular.isUndefined($scope[selector + "_units"])) {
            $log.error("convertInputs: Unrecognised selector:" + selector);
            return;
        }

        if ($scope[selector + "_units"] != $scope["_" + selector + "_units"]) {
            $log.debug(selector_fields_map[selector]);
            angular.forEach(selector_fields_map[selector], function(value, key) {
                $log.debug(value);
                var unrounded_value =  convert_unit(
                    $scope["_" + selector + "_" + value],
                    "mm",
                    $scope[selector + "_units"]);
                $log.debug(unrounded_value);
                $log.debug(decimal_places($scope[selector + "_units"]));
                $log.debug($filter('number')(unrounded_value, decimal_places($scope[selector + "_units"])));
                $log.debug($scope[selector + "_" + value]);
                //$scope[selector + "_" + value] = 9000;
                $scope[selector + "_" + value] = parseFloat(
                    $filter('number')(unrounded_value,
                        decimal_places($scope[selector + "_units"])));
            });
            updateCanvas();
            $scope["_" + selector + "_units"] = $scope[selector + "_units"];
        }
    }

    //initalise the form
    $scope.updateCanvas();

  }]);
