var ra = false;

(function ($, document, window) {

function initRaphael() {
    ra = Raphael( $('body').get(0), 0,0, $(document).width(), $(document).height());
    $("body > svg").css({
        position: "absolute",
        top: 0 + "px",
        left: 0 + "px",
        width: $(document).width() + "px",
        height: $("body").height() + "px",
        "zIndex": "0"
    });
}

window.drawTrapezoid = function(from, positionFrom, to, positionTo, attr) {
        
        if ($(to).length>1) {
            $(to).each(function(){
                drawTrapezoid(from,this,attr);
            })
            return;
        } else if ($(to).length<1) {
            return;
        } else if ($(from).length<1) {
            return;
        }
        
        var obj1 = $(from).get();
        var obj2 = $(to).get();
        
        
        
        obj1["box"] = getRaphaelObject(obj1);
        obj2["box"] = getRaphaelObject(obj2);
        
        if (!ra || $("body > svg").length == 0) {
            initRaphael();
        }
        ra.trapezoid(obj1, positionFrom, obj2, positionTo, attr);
}
        
        
function getRaphaelObject(selector) {
    var obj = new Object();

    var leftOffset = $(selector).offset().left;
    var topOffset = $(selector).offset().top;

    obj["x"] = leftOffset;
    obj["y"] = topOffset;
    obj["width"] = $(selector).outerWidth();
    obj["height"] = $(selector).outerHeight();
    
    return obj;
}

window.clearRaphael = function() {
    if (!ra) {
            initRaphael();
    }
    ra.clear();
}

/* Raphael Trapezoid Plugin
*  -> Stays in this file
*/

Raphael.fn.trapezoid = function (obj1, position1, obj2, position2, attr, line, bg) {
	
	if (obj1.line && obj1.from && obj1.to) {
	    line = obj1;
	    obj1 = line.from;
	    obj2 = line.to;
	}
	
	var bb1 = obj1["box"],
	    bb2 = obj2["box"];

	var path1;
	if (position1 == 'top') {
		path1 = [{x: bb1.x, y: bb1.y}, {x: bb1.x + bb1.width, y: bb1.y}];
	} else if (position1 == 'bottom') {
		path1 = [{x: bb1.x, y: bb1.y + bb1.height}, {x: bb1.x + bb1.width, y: bb1.y + bb1.height}];
	} else if (position1 == 'left') {
		path1 = [{x: bb1.x, y: bb1.y}, {x: bb1.x, y: bb1.y + bb1.height}];
	} else if (position1 == 'right') {
		path1 = [{x: bb1.x + bb1.width, y: bb1.y}, {x: bb1.x + bb1.width, y: bb1.y + bb1.height}];
	}

	var path2;
	if (position2 == 'top') {
		path2 = [{x: bb2.x, y: bb2.y}, {x: bb2.x + bb2.width, y: bb2.y}];
	} else if (position2 == 'bottom') {
		path2 = [{x: bb2.x, y: bb2.y + bb2.height}, {x: bb2.x + bb2.width, y: bb2.y + bb2.height}];
	} else if (position2 == 'left') {
		path2 = [{x: bb2.x, y: bb2.y}, {x: bb2.x, y: bb2.y + bb2.height}];
	} else if (position2 == 'right') {
		path2 = [{x: bb2.x + bb2.width, y: bb2.y}, {x: bb2.x + bb2.width, y: bb2.y + bb2.height}];
	}

	var path = ["M", path1[0].x,path1[0].y, "L", path1[1].x,path1[1].y, "L", path2[1].x,path2[1].y, "L", path2[0].x,path2[0].y, "z"].join(",");
	
	if (line && line.line) {
	    line.bg && line.bg.attr({path: path});
	    line.line.attr({path: path});
	} else {
	    return {
	        bg: bg && bg.split && this.path(path).attr(attr),
	        line: this.path(path).attr(attr),
	        from: obj1,
	        to: obj2
	    };
	}
}

return drawTrapezoid;

})(jQuery, document, window);