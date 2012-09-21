Raphael.fn.drawGrid = function (x, y, w, h, wv, hv, color) {
    color = color || "#000";
    var path = ["M", Math.round(x) + .5, Math.round(y) + .5, "L", Math.round(x + w) + .5, Math.round(y) + .5, Math.round(x + w) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y) + .5],
        rowHeight = h / hv,
        columnWidth = w / wv;
    for (var i = 1; i < hv; i++) {
        path = path.concat(["M", Math.round(x) + .5, Math.round(y + i * rowHeight) + .5, "H", Math.round(x + w) + .5]);
    }
    for (i = 1; i < wv; i++) {
        path = path.concat(["M", Math.round(x + i * columnWidth) + .5, Math.round(y) + .5, "V", Math.round(y + h) + .5]);
    }
    return this.path(path.join(",")).attr({stroke: color});
};

/*
$(function () {
    $("#data").css({
        position: "absolute",
        left: "-9999em",
        top: "-9999em"
    });
});
*/

window.onload = function () {
    function getAnchors(p1x, p1y, p2x, p2y, p3x, p3y) {
        var l1 = (p2x - p1x) / 2,
            l2 = (p3x - p2x) / 2,
            a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
            b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
        a = p1y < p2y ? Math.PI - a : a;
        b = p3y < p2y ? Math.PI - b : b;
        var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2,
            dx1 = l1 * Math.sin(alpha + a),
            dy1 = l1 * Math.cos(alpha + a),
            dx2 = l2 * Math.sin(alpha + b),
            dy2 = l2 * Math.cos(alpha + b);
        return {
            x1: p2x - dx1,
            y1: p2y + dy1,
            x2: p2x + dx2,
            y2: p2y + dy2
        };
    }

    var startYear = 2012;
	var endYear = 2012;
	var startMonth = 9;
	var endMonth = 9;
	var startDay = 2;
	var endDay = 20;

	var normStartMonth = formatNumber(startMonth);
	var normEndMonth = formatNumber(endMonth);
	var normStartDay = formatNumber(startDay);
	var normEndDay = formatNumber(endDay);
	
	var startDate = startYear + "-" + normStartMonth + "-" + normStartDay;
	
	
	var endDate = endYear + "-" + normEndMonth + "-" + normEndDay;
	
	

	require(["dojo/io/script", "dojo/dom", "dojo/string", "dojo/domReady!"], function(dom, string){
	  	dojo.io.script.get({
		      callbackParamName: "callback",
		      url: "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=stoxxeu600&apikey=e378a695-41ce-48ba-8a6b-ca77fbd06cf3&query=SELECT%20*%20FROM%20swdata%20WHERE%20date%20BETWEEN%20%22" + startDate + "%22%20AND%20%22" + endDate + "%22",
		      load: function(r) {
		      	plotData(r, startYear, endYear, startMonth, endMonth, startDay, endDay);
		      },
	        	error: function(error) {
	          }

		});
	});


	function formatNumber(num) {
		var result = "";
		if (num > 9) {
			result = num;
		} else {
			result = "0" + num;
		}
		return result;
	}

	function normalise(min, max, number) {
		var range = max - min;
		return ((number - min) / range);
	}

	function plotData(r, startYear, endYear, startMonth, endMonth, startDay, endDay) {
		
		var labels = [];
		var data = [];
		var originalData = [];
		
		var map = {};
		for (item in r) {
			map[r[item].date]=r[item].value;
		}
		
		var max = 0;
		var min = 0;
		var pos = 0;
		var previousValue;
		for (i=startDay;i<=endDay;i++) {
			var key = startYear + "-" + formatNumber(startMonth) + "-" + formatNumber(i);
			labels[pos] = i;
			if (map[key] === undefined) {
				if (previousValue === undefined) {
					map[key] = "0";
					originalData[pos] = "0";
				} else {
					map[key] = previousValue;
					originalData[pos] = previousValue + "";
				}
				
			} else {
				originalData[pos] = map[key] + "";
			}
			pos++;
			
			if (previousValue === undefined) {
				max = map[key];
				min = map[key];
			} else {
				if (max < map[key]) {
					max = map[key];
				}
				if (min > map[key]) {
					min = map[key];
				}
			}
			
			previousValue = map[key];
			
		}
		
		var range = max - min;
		
		for (j in originalData) {
			data[j] = ((originalData[j] - min) / range) + 0.5;
		}
		
		// labels = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","20","21","22","23","24","25","26","27","28","29","30"],
	    //    data = ["23","56","34","23","56","34","23","56","34","23","56","34","23","56","34","23","56","34","23","56","34","23","56","34","23","56","34","23","56","34"];
		
		/*	
	    $("#data tfoot th").each(function () {
	        labels.push($(this).html());
	    });
	    $("#data tbody td").each(function () {
	        data.push($(this).html());

	    });
	    */

	    // Draw
	    var width = 800,
	        height = 250,
	        leftgutter = 30,
	        bottomgutter = 20,
	        topgutter = 20,
	        colorhue = .6 || Math.random(),
	        color = "hsl(" + [colorhue, .5, .5] + ")",
	        r = Raphael("holder", width, height),
	        txt = {font: '12px Helvetica, Arial', fill: "#fff"},
	        txt1 = {font: '10px Helvetica, Arial', fill: "#fff"},
	        txt2 = {font: '12px Helvetica, Arial', fill: "#000"},
	        X = (width - leftgutter) / labels.length,
	        max = Math.max.apply(Math, data),
	        Y = (height - bottomgutter - topgutter) / max;
	    r.drawGrid(leftgutter + X * .5 + .5, topgutter + .5, width - leftgutter - X, height - topgutter - bottomgutter, 10, 10, "#000");
	    var path = r.path().attr({stroke: color, "stroke-width": 4, "stroke-linejoin": "round"}),
	        bgp = r.path().attr({stroke: "none", opacity: .3, fill: color}),
	        label = r.set(),
	        lx = 0, ly = 0,
	        is_label_visible = false,
	        leave_timer,
	        blanket = r.set();
	    
		label.push(r.text(60, 12, data[0]).attr(txt));
	    label.push(r.text(60, 27, "22" + "-" + startMonth + "-" + startYear).attr(txt1).attr({fill: color}));
	    label.hide();
	
	    var frame = r.popup(100, 100, label, "right").attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .7}).hide();

	    var p, bgpp;
	    for (var i = 0, ii = labels.length; i < ii; i++) {
	        var y = Math.round(height - bottomgutter - Y * data[i]),
	            x = Math.round(leftgutter + X * (i + .5)),
	            t = r.text(x, height - 6, labels[i]).attr(txt).toBack();
	        if (!i) {
	            p = ["M", x, y, "C", x, y];
	            bgpp = ["M", leftgutter + X * .5, height - bottomgutter, "L", x, y, "C", x, y];
	        }
	        if (i && i < ii - 1) {
	            var Y0 = Math.round(height - bottomgutter - Y * data[i - 1]),
	                X0 = Math.round(leftgutter + X * (i - .5)),
	                Y2 = Math.round(height - bottomgutter - Y * data[i + 1]),
	                X2 = Math.round(leftgutter + X * (i + 1.5));
	            var a = getAnchors(X0, Y0, x, y, X2, Y2);
	            p = p.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
	            bgpp = bgpp.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
	        }
	        var dot = r.circle(x, y, 4).attr({fill: "#333", stroke: color, "stroke-width": 2});
	        blanket.push(r.rect(leftgutter + X * i, 0, X, height - bottomgutter).attr({stroke: "none", fill: "#fff", opacity: 0}));
	        var rect = blanket[blanket.length - 1];
	        (function (x, y, data, lbl, dot) {
	            var timer, i = 0;
	            rect.hover(function () {
	                clearTimeout(leave_timer);
	                var side = "right";
	                if (x + frame.getBBox().width > width) {
	                    side = "left";
	                }
	                var ppp = r.popup(x, y, label, side, 1),
	                    anim = Raphael.animation({
	                        path: ppp.path,
	                        transform: ["t", ppp.dx, ppp.dy]
	                    }, 200 * is_label_visible);
	                lx = label[0].transform()[0][1] + ppp.dx;
	                ly = label[0].transform()[0][2] + ppp.dy;
	                frame.show().stop().animate(anim);
					var showdata = (data - 0.5) * range + min;	
	                label[0].attr({text: showdata + " " + (showdata == 1 ? "" : "")}).show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);
	                label[1].attr({text: lbl + "-" + startMonth + "-" + startYear}).show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);
	                dot.attr("r", 6);
	                is_label_visible = true;
	            }, function () {
	                dot.attr("r", 4);
	                leave_timer = setTimeout(function () {
	                    frame.hide();
	                    label[0].hide();
	                    label[1].hide();
	                    is_label_visible = false;
	                }, 1);
	            });
	        })(x, y, data[i], labels[i], dot);
	    }
	    p = p.concat([x, y, x, y]);
	    bgpp = bgpp.concat([x, y, x, y, "L", x, height - bottomgutter, "z"]);
	    path.attr({path: p});
	    bgp.attr({path: bgpp});
	    frame.toFront();
	    label[0].toFront();
	    label[1].toFront();
	    blanket.toFront();
		
	}

};