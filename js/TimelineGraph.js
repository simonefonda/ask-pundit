define(["dojo/_base/declare", 
        "dojo/io/script",
        "dojo/text!ask/tmpl/TimelineGraphTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin","dojo/date","dojo/date/stamp"], 
    function(declare, ioscript, timelineGraphTemplate, _WidgetBase, _TemplatedMixin, date, stamp) {
	
	return declare("ask.TimelineGraph", [_WidgetBase, _TemplatedMixin], {
		apiUrl: "https://api.scraperwiki.com/api/1.0/datastore/sqlite",
		apiFormat: "jsondict",
		apiKey: "e378a695-41ce-48ba-8a6b-ca77fbd06cf3",
		startDate: new Date (2012, 8, 2),
		endDate: new Date (2012, 8, 21),
		indicators: {
			stoxxeu600: true,
		},
        notebookId: '',
        templateString: timelineGraphTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
            console.log('gra startin up post mixin', this.notebookId);
        },
        startup: function() {
	
			indicatorsParameters = {
				stoxxeu600 : {
					table: "swdata",
				}
			};
			
            var self = this;
            
            self.inherited(arguments);

			var isoStartDate = dojo.date.stamp.toISOString(self.startDate, {selector: "date"});
			var isoEndDate = dojo.date.stamp.toISOString(self.endDate, {selector: "date"});
			
			// TODO: support a number of indicators using the "indicators" parameter.
			var callUrl = self.apiUrl + "?format=" + self.apiFormat + "&name=" + "stoxxeu600" + "&apikey=" + self.apiKey + "&query=SELECT%20*%20FROM%20swdata%20WHERE%20date%20BETWEEN%20%22" + isoStartDate + "%22%20AND%20%22" + isoEndDate + "%22";
			
			ioscript.get({
                callbackParamName: "callback",
                url: callUrl,
                load: function(r) {
                    console.log('Plotting ... now!');
                    self.plotData(r, self.startDate, self.endDate);
                },
                error: function(error) {
                }
       		});
            
        }, // startup()
        

    	plotData: function(r, startDate, endDate) {
		    
            var self = this;
            
    		var labels = [];
    		var data = [];
    		var inData = [];
		
			var daysRange = dojo.date.difference(startDate, endDate);
		
			var max = 0;
    		var min = 0;
		
			var cDate = startDate;
			var prevValue;
			var j = 0;
			for (i=0; i<daysRange; i++) {
				labels[i] = cDate.getDate() + "/" + (cDate.getMonth() + 1);
				var date = dojo.date.stamp.fromISOString(r[j].date);
				//if this day is missing in the data received.. 
				if (date.toISOString() !== cDate.toISOString()) {
					//...put the value of the day before if available...or the value of the next day if previous is unavailable
					if (typeof(prevValue) === "undefined") {
						inData[i] = r[j].value;
					} else {
						inData[i] = prevValue;
					}
				} else {
					inData[i] = r[j].value;
					j++;
				}
				if (typeof(prevValue) === "undefined") {
					max = inData[i];
					min = inData[i];
				} else {
					if (max < inData[i]) {
    					max = inData[i];
    				}
    				if (min > inData[i]) {
    					min = inData[i];
    				}
				}
				
				cDate = dojo.date.add(cDate, "day", 1);
				prevValue = inData[i];
			}

    		var range = max - min;
		
    		for (var j in inData) {
    			data[j] = ((inData[j] - min) / range) + 0.5;
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

    	    r.drawGrid(leftgutter + X * .5 + .5, topgutter + .5, width - leftgutter - X, height - topgutter - bottomgutter, 10, 10, "#000");

    	    var path = r.path().attr({stroke: color, "stroke-width": 4, "stroke-linejoin": "round"}),
    	        bgp = r.path().attr({stroke: "none", opacity: .3, fill: color}),
    	        label = r.set(),
    	        lx = 0, ly = 0,
    	        is_label_visible = false,
    	        leave_timer,
    	        blanket = r.set();
	    
    		label.push(r.text(60, 12, data[0]).attr(txt));
    	    label.push(r.text(60, 27, labels[0]).attr(txt1).attr({fill: color}));
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
    	                label[1].attr({text: lbl}).show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);
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