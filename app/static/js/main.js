var INITIAL_START_DATE = null;
var INITIAL_END_DATE = null;
var SCALE = 0.945;
var current_start_date = null, current_end_date = null;
var current_chosen_department = null;

$( document ).ready(function() {
    $('main_item').addClass("ui-corner-all");
    $.getJSON($SCRIPT_ROOT+"/get_data", function (data) {
        if('status' in data){
            console.log('status');
            $(".overlay_div").empty().append("<img src='static/res/error.png'><br>"+ data['status'])
        }else {
            INITIAL_START_DATE = data['date_boundaries'][0].split(" ")[0];
            INITIAL_END_DATE = data['date_boundaries'][1].split(" ")[0];
            getVisualization(data);
            toggleLoading(0, 100);
        }
    });
});

function getVisualization(data) {
    var transportations_min_max = getMaxAndMinTransportationNumbers(data);
    createGraph(data, transportations_min_max);
    createInfoTable(data, getMaxAndMinTransportationNumbers(data)[0]);
    createStatisticsTable(data);
    createDateRangePicker(data);
    appendDepartmnetsToDropList(data);
    getVizualizationSortedByMainItem(data);
}

function appendDepartmnetsToDropList(data) {
    $('#dep_filter_select').empty();
    $('#dep_filter_select').append('<option value=ALL >All</option>');
    $.each(data['facility'], function (key, value) {
        if (key === current_chosen_department){
            $('#dep_filter_select').append('<option value='+key+' selected="selected">'+key+'</option>')
        }else {
            $('#dep_filter_select').append('<option value=' + key + '>' + key + '</option>')
        }
    })
}

function createDateRangePicker(data) {
    $("#e4").daterangepicker({
                 presetRanges: [{
                     text: 'Full range',
                     dateStart: function() { return moment(INITIAL_START_DATE) },
                     dateEnd: function() { return moment(INITIAL_END_DATE) }
                 }, {
                     text: 'Previous year',
                     dateStart: function() { return moment().subtract(1, "years") },
                     dateEnd: function() { return moment() }
                 }, {
                     text: 'Previous 3 months',
                     dateStart: function() { return moment().subtract(3, "months") },
                     dateEnd: function() { return moment() }
                 }, {

                     text: 'Previous month',
                     dateStart: function() { return moment().subtract(1,"months") },
                     dateEnd: function() { return moment() }
                 }, {
                     text: 'Next month',
                     dateStart: function() { return moment() },
                     dateEnd: function() { return moment().add(1, "months") }
                 }, {
                     text: 'Next 3 months',
                     dateStart: function() { return moment() },
                     dateEnd: function() { return moment().add(3, "months") }
                 }, {

                     text: 'Next year',
                     dateStart: function() { return moment() },
                     dateEnd: function() { return moment().add(1, "years") }
                 }],
                 applyOnMenuSelect: true,
                 datepickerOptions : {
                     numberOfMonths : 3,
                     dateFormat: 'yy-mm-dd',
                     minDate: INITIAL_START_DATE,
                     maxDate: INITIAL_END_DATE,
         },
            change: function(event, data) {
                var selectedDateRange = JSON.parse($("#e4").val());
                current_start_date = selectedDateRange[0];
                current_end_date = selectedDateRange[1];
                var main_item = document.getElementById('main_item').value;
                var chosen_department = document.getElementById('dep_filter_select').value;
                current_chosen_department = chosen_department;
                if(chosen_department == 'ALL'){
                    chosen_department = ''
                }
                toggleLoading(1, 180);
                $.getJSON($SCRIPT_ROOT+"/get_data_filtered", {
                    start: selectedDateRange['start'],
                    end: selectedDateRange['end'],
                    main_item: main_item,
                    department: chosen_department
                }, function (data) {
                    if('status' in data){
                        console.log('status');
                        $(".overlay_div").empty().append("<img src='static/res/error.png'><br>"+ data['status'])
                    }else {
                        d3.select("svg").remove();
                        getVisualization(data);
                        toggleLoading(0, 100);
                    }});
            }
        });
}

function getVizualizationSortedByMainItem(){
    if(current_end_date == null || current_start_date == null){
        current_start_date = INITIAL_START_DATE;
        current_end_date = INITIAL_END_DATE;
    }
    $("#apply_button").click(function () {
        var main_item = document.getElementById("main_item").value;
        var chosen_department = document.getElementById("dep_filter_select").value;
        current_chosen_department = chosen_department;
        if (chosen_department == 'ALL') {
            chosen_department = '';
        }
        toggleLoading(1, 180);
        $.getJSON($SCRIPT_ROOT + "/get_data_filtered", {
            start: current_start_date,
            end: current_end_date,
            main_item: main_item,
            department: chosen_department
        }, function (data) {
            if ('status' in data) {
                console.log('status');
                $(".overlay_div").empty().append("<img src='static/res/error.png'><br>" + data['status'])
            } else {
                d3.select("svg").remove();
                getVisualization(data);
                toggleLoading(0, 100);
            }
        })
    })

}

function createStatisticsTable(json_data){
    var dummy_transportations_amount = 0;
    var total_transportations_times = 0;
    var total_items_transported = 0;
    $.each(json_data['edges'], function (key, value) {
        if(value[0].split(".")[0]=="DUMMY"||value[1].split(".")[0] == "DUMMY"){
            dummy_transportations_amount+=value[2];
        }
        total_transportations_times+=value[3];
        total_items_transported+=value[2];
    });
    $(".total_amount_of_transportations").empty().append(total_transportations_times);
    $(".total_items_transported").empty().append(total_items_transported);
    $(".dummy_count").empty().append(dummy_transportations_amount);
    $(".dep_involved").empty().append(json_data["involved_edges_count"]+" from 14");
    $(".date_range").empty().append(json_data['date_boundaries'][0].split(" ")[0]+" - "+json_data['date_boundaries'][1].split(" ")[0]);
    $(".omitted_self-edges").empty().append(json_data['self_edges_total_weight']);
}

function toggleLoading(opacity, speed){
    var overlay = $("#full_page_overlay");
    if(opacity) overlay.show();
    overlay.stop().fadeTo(speed, opacity);
    $("#header").stop().fadeTo(speed, 1-opacity);
    $("#viz_container").stop().fadeTo(speed, 1-opacity);
    $("#footer_container").stop().fadeTo(speed, 1-opacity);
    if(!opacity) overlay.hide();
}


function createInfoTable(json_data, max_transportation_value) {
    var color = 0;
    var append_str = '';
    var table = $('table');
    $.tablesorter.clearTableBody = function (table) {
        $('tbody', table).empty();
    };
    $.tablesorter.clearTableBody(table[0]);
    $.each(json_data['edges'], function (key, value) {
        if (value[4]['distance'] === undefined) {
            value[4]['distance'] = 0;
            value[4]['time'] = '-';
        }
        var total_trtime = moment.duration(value[4]['time'] * value[3], "seconds");
        if (isNaN(value[4]['distance'] * value[3])) {
            //  value[4]['distance']*value[3] = '-';
        }
        if (total_trtime.days() != 0) {
            color = getColor(value[2], max_transportation_value);
            append_str += "<tr><td style='background-color:" + d3.color(color) + "'></td>" +
                "<td>" + value[0].split(".")[0] + "</td>" +
                "<td>" + value[3] + "</td>" +
                "<td>" + value[2] + "</td>" +
                "<td>" + (value[4]['distance'] * value[3]).toFixed(2) + "</td>" +
                "<td>" + total_trtime.days() + ' d ' + total_trtime.hours() + ' h ' + total_trtime.minutes() + ' min ' + "</td>" +
                "<td>" + value[1].split(".")[0] + "</td></tr>";
        } else {
            color = getColor(value[2], max_transportation_value);
            append_str += "<tr><td style='background-color:" + d3.color(color) + "'></td>" +
                "<td>" + value[0].split(".")[0] + "</td>" +
                "<td>" + value[3] + "</td>" +
                "<td>" + value[2] + "</td>" +
                "<td>" + (value[4]['distance'] * value[3]).toFixed(2) + "</td>" +
                "<td>" + total_trtime.hours() + ' h ' + total_trtime.minutes() + ' min ' + "</td>" +
                "<td>" + value[1].split(".")[0] + "</td></tr>";
        }
    });
    table.append(append_str).trigger('update');
    $(".tablesorter").tablesorter({
        headers: {0: {sorter: false}},
        theme: 'blue',
        sortList: [[3, 0]]
    });
    var rows = $('table tbody tr');
    var arc1_generated_color = null; // arc2_generated_color = null;
    rows.hover(function () {
        var src_dep = $(this).find("td").eq(1).html();
        var dest_dep = $(this).find("td").eq(6).html();
        var src_circle = d3.select('#' + src_dep);
        src_circle.style("fill", "blue");
        var dest_circle = d3.select('#' + dest_dep);
        dest_circle.style("fill", "blue");
        var src_dest_line = $('[src="'+src_dep+'"][dest="'+dest_dep+'"]');
        var edge_color = d3.select(src_dest_line[0]).style("stroke");
        if(edge_color != "rgb(0, 0, 255)"){
            arc1_generated_color = edge_color;
        }
        //if($('[src="'+dest_dep+'"][dest="'+src_dep+'"]')[0] != null){
        //    var dest_dep_line =  $('[src="'+dest_dep+'"][dest="'+src_dep+'"]');
        //    var twin_edge_color = d3.select(dest_dep_line[0]).style("stroke");
         //   if(twin_edge_color != "rgb(0, 0, 255)"){
         //       arc2_generated_color = twin_edge_color;
         //   }
         //  d3.select(dest_dep_line[0]).style("stroke", "blue")
        //}
        d3.select(src_dest_line[0]).style("stroke", "blue");
    },
    function () {
        var src_dep = $(this).find("td").eq(1).html();
        var dest_dep = $(this).find("td").eq(6).html();
        var src_circle = d3.select('#' + src_dep);
        src_circle.style("fill", "black");
        var dest_circle = d3.select('#' + dest_dep);
        dest_circle.style("fill", "black");
        var src_dep_line = $('[src="'+src_dep+'"][dest="'+dest_dep+'"]');
        d3.select(src_dep_line[0]).style("stroke", arc1_generated_color);
        //if(arc2_generated_color != null){
        //    dest_dep_line = $('[src="'+dest_dep+'"][dest="'+src_dep+'"]');
        //    d3.select(dest_dep_line[0]).style("stroke", arc2_generated_color);
        //}
    });
}
/*
Return the max and min X and Y of the department boundaries
Used for department scaling
 */
function findMaxXandY(json_data){
    var max_x = 0;
    var max_y = 0;
    $.each(json_data['facility'], function (key1, value1) {
        $.each(value1["boundaries"], function (key, value){
            if (value[0] > max_x){
                max_x = value[0]
            }
            if (value[1] > max_y){
                max_y = value[1]
            }
        })
    });
    var max_values = [max_x, max_y];
    return max_values
}


/*
Takes all transportation records from json and sort it
Need for color legend drawing
return: sorted array of transportation records numbers
 */
function getSortedTransportationRecords(json_data) {
    var arr = [];
    $.each(json_data['edges'], function (key, value) {
        arr.push(value[2])
    });
    return arr.sort(function (a,b) {return a-b})
}

/*
As input takes integer array of transportation records numbers
Draw the color legend
 */
function draw_color_legend(arr){
    var max_transportation_value  = Math.max.apply(Math, arr);
    for(var i=0; i<arr.length;i++){
        var hsv = getColor(arr[i], max_transportation_value);
        var item = "<li style='background-color:" + getColor(arr[i], max_transportation_value) + "'></li>";
        $("#ul_color_map").append(item);
    }
}
function scalePoints(json_data, key, xLinearScale, yLinearScale){
    var points = [];
    $.each(json_data['facility'][key]['boundaries'], function (key, value) {
        var scaled_x_y = [xLinearScale(value[0])*SCALE, yLinearScale(value[1])*SCALE];
        points.push(scaled_x_y);
    });
    return points
}

function getMaxAndMinTransportationNumbers(json_data) {
    var max_transportation_number = 0;
    var min_transportation_number = 1000000;
    $.each(json_data['edges'], function (key, value) {
        var number = value[2];
        if (number > max_transportation_number) {
            max_transportation_number = number;
        }
        if (number < min_transportation_number){
            min_transportation_number = number;
        }
        });
    return [max_transportation_number, min_transportation_number]
}

function generateTotalDistanceColor(data) {

    
}
function generateLineColor(number, max_total_distance, min_total_distance) {
    if(!isNaN(number)) {
        var a = 0, b = 255;
        var r = Math.ceil(((number - min_total_distance) / (max_total_distance - min_total_distance)) * (b - a) + a);
        return r
    }
    return 0;
}

function getColor(value, max_transportation_number){
    var hue = Math.floor((max_transportation_number - value) * 120 / max_transportation_number).toString(10)
    var saturation = Math.abs(value - 75)/20;
    return ["hsl(",hue,","+saturation+"%,70%)"].join("");
}

function getMinMaxTotalDistance(edges){
    var distances = [];
    $.each(edges, function(key, value){
        if(!isNaN(value[4]['distance'])) {
            distances.push(value[3] * value[4]['distance'])
        }else{
            distances.push(0)
        }
    });
    return [Math.min.apply(null, distances), Math.max.apply(null, distances)]
}

function createDepartments(data, xLinearScale, yLinearScale, gContainer) {
    $.each(data['facility'],function (key, value) {
                gContainer.append('polygon')
                    .style("stroke-width", 5)
                    .attr("points", scalePoints(data,key, xLinearScale, yLinearScale))
                    .attr("stroke", '#444444')
                    .style("pointer-events", "all")
                    .attr("fill", '#dbe9ee')
    });
}

function createEdges(data, gContainer, svgContainer, xLinearScale, yLinearScale, distance_range_arr, transportation_ranges) {
    $.each(data['edges'], function(key, value){
            var src = value[0].split(".")[0];
            var dest = value[1].split(".")[0];
            var trtime = moment.duration(value[4]['time'], 'seconds');
            var distance = value[4]['distance'];
            var times = value[3];
            var get_color = d3.scaleLinear()
                .domain([distance_range_arr[0], distance_range_arr[1]])
                .range([0, 255]);
            // CHANGE COLORS
            //var colorSortedByTotalDistance = generateLineColor(times*distance, distance_range_arr[0], distance_range_arr[1]);
            //var color = d3.rgb(colorSortedByTotalDistance, 0, 0);
            var color2 = getColor(value[2],transportation_ranges[0]);
            //console.log(generateLineColor(distance, distance_range_arr[0], distance_range_arr[1]));
            var offset = 0;
            for(var i=0; i<data['edges'].length; i++ ) {
                if (data.edges[i][0].split('.')[0] == dest && data.edges[i][1].split('.')[0] == src) {
                    offset = 1
                }
            }
            if($('[src="'+dest+'"]').length == 0){
                offset = -2
            }
            // arrowhead config
             svgContainer.append("svg:defs").append("svg:marker")
                .attr("id", "triangle")
                .attr("refX", 12)
                .attr("refY", 2)
                .attr("markerWidth", 5)
                .attr("markerHeight", 5)
                .attr("orient", "auto")
              .append("path")
                 // triangle
                .attr("d", "M0,0 L0,4 L4,2 z")
                .style("fill", "black");
            // appending our lines between departments
            gContainer.append("line")
                .attr("class", "arrow")
                .attr("src", src)
                .attr("dest", dest)
                .attr("offset", offset)
                .style("stroke", d3.color(color2))
                .style("stroke-width", 3.5)
                .attr("value", value[2])
                .attr("x1", xLinearScale(data['facility'][value[0].split('.')[0]]['points']['centroid'][0])*SCALE + offset)
                .attr("y1", yLinearScale(data['facility'][value[0].split('.')[0]]['points']['centroid'][1])*SCALE + offset)
                .attr("x2", xLinearScale(data['facility'][value[1].split('.')[0]]['points']['centroid'][0])*SCALE + offset)
                .attr("y2", yLinearScale(data['facility'][value[1].split('.')[0]]['points']['centroid'][1])*SCALE + offset)
                // add marker to the line
                .attr("marker-end", "url(#triangle)")
                .on("mouseover", function (d) {
                    var value = d3.select(this).attr("value");
                    d3.select('.viz_info_text')
                        .style("font-style", "normal")
                        .text(src+" - "+dest+": Quantity: "+value+", Times: "+times+", Distance: "+distance+" m , Transportation Time: "+trtime.minutes()+" min "+trtime.seconds()+" sec")

                })
                .on("mouseout", function (d) {
                        d3.select('.viz_info_text')
                            .style("font-style","italic")
                            .text('no additional info to display');
                    })

    });

}

function createGraph(json_data, transportation_ranges) {
    var height = document.getElementById("factory_transp_container").offsetHeight;
    var width = document.getElementById("factory_transp_container").offsetWidth;
    var max_x_y = findMaxXandY(json_data);
    var edges = json_data['edges'];
    var facility = json_data['facility'];
    var xLinearScale = d3.scaleLinear()
        .domain([0, max_x_y[0]])
        .range([(1-SCALE)*width,width*SCALE]);

    var yLinearScale = d3.scaleLinear()
        .domain([0,max_x_y[1]])
        .range([(1-SCALE)*height,height*SCALE]);

    var zoom = d3.zoom()
        .scaleExtent([1,10])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    var svgContainer = d3.select("#factory_transp_container")
        .append("svg")
        .attr("viewBox", "0 0 "+xLinearScale(max_x_y[0])+" "+yLinearScale(max_x_y[1])+"")
        .attr('height',height)
        .attr('width', width)
        .call(zoom);

    var gContainer = svgContainer
        .append("g")
        .attr('height', height)
        .attr('width', width)
        .call(zoom);

    function zoomed() {
        d3.select('#factory_transp_container').select("g")
            .attr('transform', d3.event.transform);
    }

    d3.select("#reset")
        .on("click", resetted);

    d3.select("#zoom_in")
        .on("click", zoom_in);

    d3.select("#zoom_out")
        .on("click", zoom_out);

    function resetted() {
        gContainer.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    }

    function zoom_in(){
        gContainer.call(zoom.scaleBy(gContainer, 1.5));
    }

    function zoom_out() {
        gContainer.call(zoom.scaleBy(gContainer, 0.66));
    }

    var distance_range_arr = getMinMaxTotalDistance(json_data['edges']);
    createDepartments(json_data, xLinearScale, yLinearScale, gContainer);
    createEdges(json_data,gContainer, svgContainer, xLinearScale, yLinearScale, distance_range_arr, transportation_ranges);
    var edges = json_data['edges'];
    $.each(json_data['facility'],function (key, value) {
        gContainer.append('rect')
            .attr("id", key)
            .attr("x", xLinearScale(value['points']['centroid'][0])*SCALE-6)
            .attr("y", yLinearScale(value['points']['centroid'][1])*SCALE-6)
            .attr('width', 12)
            .attr('height', 12)
            .attr("fill", "#444444");
        gContainer.append('text')
            .style("fill", "#444444")
            .attr("x", xLinearScale(value['points']['centroid'][0])*SCALE)
            .attr("y", yLinearScale(value['points']['centroid'][1])*SCALE)
            .attr("font-size", "15px")
            .attr("dy", "-.85em")
            .attr("font-family", "Lato")
            .attr("text-anchor", "middle")
            .text(key)
    });
};