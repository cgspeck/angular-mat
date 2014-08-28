/*globals window, Image, document*/
'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('matBoardCalculator', ['$scope', '$log', '$filter',
    function($scope, $log, $filter) {
    $scope.mat_width = 40; // internally store values as metric mm
    $scope.mat_height = 40; // internally store values as metric mm
    $scope.page_width = 29.7;
    $scope.page_height = 21;
    $scope.image_width = 20;
    $scope.image_height = 20;
    //$scope.image_left_margin = 0;
    //$scope.image_top_margin = 0;
    $scope.options_overlap = 0.3; // mm
    $scope.options_bottom_weight = 2.5;
    $scope.options_show_measurements = true;

    $scope.options_units = "cm";
    $scope._options_units = "cm";
    $scope.image_units = "cm";
    $scope._image_units = "cm";
    $scope.mat_units = "cm";
    $scope._mat_units = "cm";
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
    var mat_colour = "DarkKhaki";

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
        var fields = ['mat_width', 'mat_height', 'image_width',
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
        var height_difference = avaliable_height - $scope._mat_height;
        var width_difference = avaliable_width - $scope._mat_width;

        if (height_difference < 0 || width_difference < 0) {
            //sheet is larger than canvas, need to return a value < 1
            if (width_difference < height_difference) {
                //limit by avaliable width
                return (avaliable_width / $scope._mat_width);
            } else {
                //limit by avaliable height
                return (avaliable_height / $scope._mat_height);
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

    function drawLineWithAnnotation(ctx, x1, y1, x2, y2, annotation) {
        $log.info(x1);
        $log.info(y1);
        $log.info(x2);
        $log.info(y2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth=1;
        ctx.stroke();
        ctx.closePath();

        if (annotation.length > 0)
        {
            $log.info("TODO: Display annotations");
            if (y1 == y2) {
                //line is horizontal
            } else if (x1 == x2) {
                //line is vertical

            } else {
                $log.error("Cannot place annotation on diagonal line");
            }
        }
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
        var calculated_mat_width = $scope._mat_width * scale;
        var calculated_mat_height = $scope._mat_height * scale;
        var left_mat_offset = canvas_padding + ((avaliable_width - calculated_mat_width) / 2);
        var top_mat_offset = canvas_padding + ((avaliable_height - calculated_mat_height) / 2);
        // drawing the mat board itself
        ctx.rect(left_mat_offset, top_mat_offset, calculated_mat_width, calculated_mat_height);
        ctx.lineWidth=3;
        ctx.strokeStyle="Black";
        ctx.stroke();
        ctx.fillStyle=mat_colour;
        ctx.fill(); 
        // now draw the paper sheet
        var calculated_page_width = $scope._page_width * scale;
        var calculated_page_height = $scope._page_height * scale;
        var calculated_page_left_offset = left_mat_offset + ($scope._page_left_offset * scale);
        var calculated_page_top_offset = top_mat_offset + ($scope._page_top_offset * scale);

        if (calculated_page_width < 1) {
            calculated_page_width = 1;
        }
        if (calculated_page_height < 1) {
            calculated_page_height = 1;
        }

        ctx.fillStyle="White";
        ctx.fillRect(calculated_page_left_offset, calculated_page_top_offset,
            calculated_page_width, calculated_page_height);

        // now draw the image
        var calculated_image_width = $scope._image_width * scale;
        var calculated_image_height = $scope._image_height * scale;

        // the context does not honour values less than 1
        if (calculated_image_width < 1) {
            calculated_image_width = 1;
        }
        if (calculated_image_height < 1) {
            calculated_image_height = 1;
        }

        var calculated_image_left_offset = calculated_page_left_offset + ($scope._image_left_margin * scale);
        var calculated_image_top_offset = calculated_page_top_offset + ($scope._image_top_margin * scale);
        
        
        var img=new Image();

        var req_img_width = calculated_image_width;
        var req_img_height = calculated_image_height;

        if (req_img_height < 501) {
            req_img_height = 501;
        }

        if (req_img_width < 501) {
            req_img_width = 501;
        }

        img.src='http://placekitten.com/' + parseInt(req_img_width)  + '/' + parseInt(req_img_height);
        img.onload = function(){
            ctx.drawImage(img, calculated_image_left_offset, calculated_image_top_offset, calculated_image_width, calculated_image_height);
            if (canvas_id == "front_canvas") {
                ctx.fillStyle = mat_colour;
                // left panel
                var calculated_panel_width = $scope._window_left_offset * scale;
                ctx.fillRect(left_mat_offset, top_mat_offset,
                    calculated_panel_width, calculated_mat_height);
                // right panel
                var right_panel_offset = (calculated_mat_width + left_mat_offset) - calculated_panel_width;
                ctx.fillRect(right_panel_offset, top_mat_offset,
                    calculated_panel_width, calculated_mat_height);
                // top
                var calculated_top_panel_height = $scope._window_top_offset * scale;
                ctx.fillRect(left_mat_offset, top_mat_offset,
                    calculated_mat_width, calculated_top_panel_height);
                //bottom
                var calculated_bottom_panel_height = $scope._window_bottom_offset * scale;
                var calculated_bottom_panel_offset = (top_mat_offset + calculated_mat_height) - calculated_bottom_panel_height;
                ctx.fillRect(left_mat_offset, calculated_bottom_panel_offset,
                    calculated_mat_width, calculated_bottom_panel_height);

                if ($scope.options_show_measurements) {
                    // draw the lines between the mat and the window
                    drawLineWithAnnotation(ctx,
                        left_mat_offset,
                        canvas.height/2,
                        left_mat_offset + calculated_panel_width,
                        canvas.height/2,
                        $scope.window_left_offset.toString());

                    drawLineWithAnnotation(ctx,
                        right_panel_offset,
                        canvas.height/2,
                        right_panel_offset + calculated_panel_width,
                        canvas.height/2,
                        $scope.window_left_offset.toString());

                    drawLineWithAnnotation(ctx,
                        canvas.width/2,
                        top_mat_offset,
                        canvas.width/2,
                        top_mat_offset + calculated_top_panel_height,
                        $scope.window_top_offset.toString());

                    drawLineWithAnnotation(ctx,
                        canvas.width/2,
                        calculated_bottom_panel_offset,
                        canvas.width/2,
                        calculated_mat_height + top_mat_offset,
                        $scope.page_top_offset.toString());
                }
            }
        };

        if ($scope.options_show_measurements && canvas_id == "back_canvas") {
            // draw the lines between the mat and the sheet
            drawLineWithAnnotation(ctx,
                left_mat_offset,
                canvas.height/2,
                calculated_page_left_offset,
                canvas.height/2,
                $scope.page_left_offset.toString());

            drawLineWithAnnotation(ctx,
                calculated_page_left_offset + calculated_page_width,
                canvas.height/2,
                calculated_mat_width + left_mat_offset,
                canvas.height/2,
                $scope.page_left_offset.toString());

            drawLineWithAnnotation(ctx,
                canvas.width/2,
                top_mat_offset,
                canvas.width/2,
                calculated_page_top_offset,
                $scope.page_top_offset.toString());

            drawLineWithAnnotation(ctx,
                canvas.width/2,
                calculated_page_top_offset + calculated_page_height,
                canvas.width/2,
                calculated_mat_height + top_mat_offset,
                $scope.page_top_offset.toString());
        }

    }

    function calculateDistances() {
        // Window - for front mat
        $scope._window_left_offset = ($scope._mat_width - $scope._image_width) / 2;  //internally using mm
        $scope._window_top_offset = ($scope._mat_height - $scope._image_height) / 2;  //internally using mm
        $scope._window_bottom_offset = $scope._window_top_offset;
        $scope._window_top_offset = $scope._window_top_offset - $scope._options_bottom_weight;
        $scope._window_bottom_offset = $scope._window_bottom_offset + $scope._options_bottom_weight;

        ['_window_left_offset', '_window_top_offset', '_window_bottom_offset'].map( function(item) {
            $scope[item] = $scope[item] + $scope._options_overlap; // adjust for overlap
        });
        // Print - for back
        $scope._page_left_offset = ($scope._mat_width - $scope._page_width) / 2;  //internally using mm
        $scope._page_top_offset = ($scope._mat_height - $scope._page_height) / 2;  //internally using mm
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
        angular.element(document.getElementById("mat_height")).removeClass("ng-invalid");
        angular.element(document.getElementById("image_width")).removeClass("ng-invalid");
        angular.element(document.getElementById("page_width")).removeClass("ng-invalid");
        angular.element(document.getElementById("mat_width")).removeClass("ng-invalid");

        if ($scope._image_height > $scope._page_height) {
            ok = false;
            msg = "Image height must be less than page height.";
            document.getElementById("page_height").className += " ng-invalid";
            document.getElementById("image_height").className += " ng-invalid";
        }

        if ($scope._page_height > $scope._mat_height) {
            ok = false;
            msg = lnbrk(msg) + "Page height must be less than mat height.";
            document.getElementById("page_height").className += " ng-invalid";
            document.getElementById("mat_height").className += " ng-invalid";
        }

        if ($scope._image_width > $scope._page_width) {
            ok = false;
            msg = "Image width must be less than page width.";
            angular.element(document.getElementById("image_width")).addClass("ng-invalid");
            angular.element(document.getElementById("page_width")).addClass("ng-invalid");
        }

        if ($scope._page_width > $scope._mat_width) {
            ok = false;
            msg = lnbrk(msg) + "Page width must be less than mat width.";
            angular.element(document.getElementById("mat_width")).addClass("ng-invalid");
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
                $scope.sizeErrors = true;
                $scope.sizeErrorString = "One or more fields empty or invalid.";
                return;
            }

        }
        normaliseFigures();

        var size_validation = do_size_validations();

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
            angular.forEach(selector_fields_map[selector], function(value, key) {
                var unrounded_value =  convert_unit(
                    $scope["_" + selector + "_" + value],
                    "mm",
                    $scope[selector + "_units"]);
                $scope[selector + "_" + value] = parseFloat(
                    $filter('number')(unrounded_value,
                        decimal_places($scope[selector + "_units"])).replace(/,/g, ''));
            });
            $scope["_" + selector + "_units"] = $scope[selector + "_units"];

            if (selector == "options") {
                $scope.updateCanvas();
            }
        }
    }

    //initalise the form
    $scope.updateCanvas();

  }]);
