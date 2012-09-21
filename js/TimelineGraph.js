define(["dojo/_base/declare", 
        "dojo/io/script",
        "dojo/text!ask/tmpl/TimelineGraphTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, ioscript, timelineGraphTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.TimelineGraph", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        templateString: timelineGraphTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
            console.log('gra startin up post mixin', this.notebookId);
        },
        startup: function() {
            var self = this;
            
            // self.inherited(arguments);
            
            console.log('very nice');
            
            var startYear = 2012,
                endYear = 2012,
                startMonth = 9,
                endMonth = 9,
                startDay = 2,
                endDay = 20;
            
            console.log('22 ---------');
            
        	var normStartMonth = self.formatNumber(startMonth);
        	var normEndMonth = self.formatNumber(endMonth);
        	var normStartDay = self.formatNumber(startDay);
        	var normEndDay = self.formatNumber(endDay);
	
            console.log('22');
    
        	var startDate = startYear + "-" + normStartMonth + "-" + normStartDay;
	
        	var endDate = endYear + "-" + normEndMonth + "-" + normEndDay;

            console.log('3333');

            ioscript.get({
                callbackParamName: "callback",
                url: "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=stoxxeu600&apikey=e378a695-41ce-48ba-8a6b-ca77fbd06cf3&query=SELECT%20*%20FROM%20swdata%20WHERE%20date%20BETWEEN%20%22" + startDate + "%22%20AND%20%22" + endDate + "%22",
                load: function(r) {
                    console.log('Plotting ... now!');
                    self.plotData(r, startYear, endYear, startMonth, endMonth, startDay, endDay);
                },
                error: function(error) {
                }
       		});
            
            console.log('ti graph startup done');
        }, // startup()
        

    	plotData: function(r, startYear, endYear, startMonth, endMonth, startDay, endDay) {
		    
            console.log('startin plot');
            var self = this;
            
    		var labels = [];
    		var data = [];
    		var originalData = [];
		
    		var map = {};
    		for (var item in r) {
    			map[r[item].date]=r[item].value;
    		}
		
    		var max = 0;
    		var min = 0;
    		var pos = 0;
    		var previousValue;
            
            console.log('wtf 111');
            
            
    		for (i=startDay;i<=endDay;i++) {
    			var key = startYear + "-" + self.formatNumber(startMonth) + "-" + self.formatNumber(i);
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

            console.log('wtf 222', min, max, range);
		
    		for (var j in originalData) {
    			data[j] = ((originalData[j] - min) / range) + 0.5;
                console.log('original data?')
    		}

    	    // Draw
    	    var width = 800,
    	        height = 250,
    	        leftgutter = 30,
    	        bottomgutter = 20,
    	        topgutter = 20,
    	        colorhue = 0.6 || Math.random(),
    	        color = "hsl(" + [colorhue, .5, .5] + ")",
                ask_container = dojo.query('.raphael-graph-'+self.notebookId)[0],
    	        r = Raphael(ask_container, width, height),
    	        txt = {font: '12px Helvetica, Arial', fill: "#fff"},
    	        txt1 = {font: '10px Helvetica, Arial', fill: "#fff"},
    	        txt2 = {font: '12px Helvetica, Arial', fill: "#000"},
    	        X = (width - leftgutter) / labels.length,
    	        max = Math.max.apply(Math, data),
    	        Y = (height - bottomgutter - topgutter) / max;

            console.log('wtf 333');
                

    	    r.drawGrid(leftgutter + X * .5 + .5, topgutter + .5, width - leftgutter - X, height - topgutter - bottomgutter, 10, 10, "#000");

            console.log('wtf 4444');


    	    var path = r.path().attr({stroke: color, "stroke-width": 4, "stroke-linejoin": "round"}),
    	        bgp = r.path().attr({stroke: "none", opacity: .3, fill: color}),
    	        label = r.set(),
    	        lx = 0, ly = 0,
    	        is_label_visible = false,
    	        leave_timer,
    	        blanket = r.set();
                
            console.log('wtf label? ', labels);
	    
    		label.push(r.text(60, 12, data[0]).attr(txt));
    	    label.push(r.text(60, 27, "22" + "-" + startMonth + "-" + startYear).attr(txt1).attr({fill: color}));
    	    label.hide();
	
            console.log('wtf 2');
    
    	    var frame = r.popup(100, 100, label, "right").attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .7}).hide();

            console.log('wtf 343143141341');

    	    var p, bgpp;
    	    for (var i = 0, ii = labels.length; i < ii; i++) {
                
                console.log('## for head ', i, ii, data[i]);
                
    	        var y = Math.round(height - bottomgutter - Y * data[i]),
    	            x = Math.round(leftgutter + X * (i + .5)),
    	            t = r.text(x, height - 6, labels[i]).attr(txt).toBack();

    	        if (!i) {
    	            p = ["M", x, y, "C", x, y];
    	            bgpp = ["M", leftgutter + X * .5, height - bottomgutter, "L", x, y, "C", x, y];
    	        }
                
                console.log('### not here please');

    	        if (i && i < ii - 1) {
    	            var Y0 = Math.round(height - bottomgutter - Y * data[i - 1]),
    	                X0 = Math.round(leftgutter + X * (i - .5)),
    	                Y2 = Math.round(height - bottomgutter - Y * data[i + 1]),
    	                X2 = Math.round(leftgutter + X * (i + 1.5));
    	            var a = getAnchors(X0, Y0, x, y, X2, Y2);
    	            p = p.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
    	            bgpp = bgpp.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
    	        }
                
                console.log('## wtf for for ', i, ii);
                
                
    	        var dot = r.circle(x, y, 4).attr({fill: "#333", stroke: color, "stroke-width": 2});
    	        blanket.push(r.rect(leftgutter + X * i, 0, X, height - bottomgutter).attr({stroke: "none", fill: "#fff", opacity: 0}));
    	        var rect = blanket[blanket.length - 1];

                console.log('## HIER?');

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
                            
                        console.log('inner inner ', i);
                        
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
                
                console.log('## dafuq for end', i, ii);
    	    }
            
            console.log('MAI GOD');
            
    	    p = p.concat([x, y, x, y]);
    	    bgpp = bgpp.concat([x, y, x, y, "L", x, height - bottomgutter, "z"]);
    	    path.attr({path: p});
    	    bgp.attr({path: bgpp});
    	    frame.toFront();
    	    label[0].toFront();
    	    label[1].toFront();
    	    blanket.toFront();
		
            console.log('end plot');
        
    	}, // plotData

    	formatNumber: function(num) {
            
            console.log('for num', num);
            
    		var result = "";
    		if (num > 9) {
    			result = num;
    		} else {
    			result = "0" + num;
    		}
    		return result;
            
            console.log('for num', num);
            
    	}
        
	});

});