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

        $log.debug(scale);
        $log.debug(avaliable_width);
        $log.debug(avaliable_height);
        //$log.debug(left_offset);
        //$log.debug(top_offset);
        $log.debug(calculated_sheet_width);
        $log.debug(calculated_sheet_height);
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
                $log.debug('onload finished');
                $log.debug(cxt);
                $log.debug(left_image_offset);
                $log.debug(parseInt(left_image_offset));
                $log.debug(top_image_offset);
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
            //ctx.stroke();
        } else {
            // TODO: the space is just a void, size of the image
            $log.debug("drawing hole");
            /*ctx.rect(left_image_offset,
                top_image_offset,
                calculated_image_width,
                calculated_image_height);*/
            //ctx = canvas.getContext("2d");
            ctx.fillStyle = canvas_colour;
            ctx.fillRect(left_image_offset,
                top_image_offset,
                calculated_image_width,
                calculated_image_height);
            //ctx.fillStyle=canvas_colour;
            //ctx.fill();
            /*$log.debug(left_image_offset);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "Black";
            ctx.stroke();*/
        }
    }

    $scope.updateCanvas = function() {
        normaliseFigures();
        // make our canvasses as wide as they can be
        var results_div = document.getElementById('resultsDiv');

        ['front_canvas', 'back_canvas'].map( function(canvas_id) {
            $log.debug(canvas_id);
            var canvas = document.getElementById(canvas_id);
            canvas.width = results_div.offsetWidth;
            clearCanvas(canvas);
            drawSheetAndImage(canvas, canvas_id);
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
