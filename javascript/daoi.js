/*
+---------------------------------------------------------------------------------------
|
|      ___ __     __         __                       ___    
|  ___/ (_) /__ _/ /____ ___/ / ___ ____ ____   ___  / _/    
| / _  / / / _ `/ __/ -_) _  / / _ `/ _ `/ -_) / _ \/ _/     
| \_,_/_/_/\_,_/\__/\__/\_,_/  \_,_/\_, /\__/  \___/_/       
|                                  /___/                     
|    _      ___                    __  _         
|   (_)__  / _/__  ______ _  ___ _/ /_(_)__  ___ 
|  / / _ \/ _/ _ \/ __/  ' \/ _ `/ __/ / _ \/ _ \
| /_/_//_/_/ \___/_/ /_/_/_/\_,_/\__/_/\___/_//_/
|
| ...by: 
| Max Lovenheim Irwin.
|
| ...for:
| Conflicts In Time,
| Hastings Arts Forum, March 2011.
|
| One of the many things for Daey.
| I miss you.
|
| 
+---------------------------------------------------------------------------------------
*/



//
//  Things that change the dilation:
//
var _distance = 10000*1000; //approximate meters return trip from St Leonards to Boston
var _velocity = _distance/0.1; //velocitity of internet return trip ping
var _velocity2 = _velocity*_velocity;

//
//  Cheeky Object extensions
//
var ha = 255/24, sa = 255/60;
Math.square=function(n) {return n*n}
Math.max = function() { for(var i=1,l=arguments.length,max=arguments[0];i<l;i++) { max=(max<arguments[i])?arguments[i]:max; } return max; }
String.format = function (str) { for (var i = 1, l = arguments.length; i < l; i++) { str = str.replace('{' + (i - 1) + '}', arguments[i]); } return str; }
Date.prototype.OO = function(val) {var s=val.toString(); return (s.length>1)?s:"0"+s; }
Date.prototype.OOO = function(val) {var s=val.toString(); return ((s.length>2)?s:((s.length>1)?"0"+s:"00"+s)); }
Date.prototype.toTimeString = function() { return String.format("{0}:{1}:{2}.{3}",this.OO(this.getUTCHours()),this.OO(this.getUTCMinutes()),this.OO(this.getUTCSeconds()),this.OO(Math.floor(this.getUTCMilliseconds()/10))); }
Date.prototype.toShortString = function() { return String.format("{0}-{1}-{2} {3}:{4}:{5}.{6}",(this.getUTCFullYear()),(this.OO(this.getUTCMonth()+1)),this.OO(this.getUTCDate()),this.OO(this.getUTCHours()),this.OO(this.getUTCMinutes()),this.OO(this.getUTCSeconds()),this.OO(Math.floor(this.getUTCMilliseconds()/10))); }
Date.prototype.toHex = function() { return '#' + this.OO(parseInt(this.getUTCHours() * ha).toString(16)) + this.OO(parseInt(this.getUTCMinutes() * sa).toString(16)) + this.OO(parseInt(this.getUTCSeconds() * sa).toString(16)); }

//
// Physics pocketknife to calculate time dilation and cartesian distance
//
var Physics = {
	c2 : 299792458 * 299792458,
	timeDilation: function (elapsed, velocity2) { return (elapsed/Math.sqrt(1-((velocity2)/this.c2))); },
	coordDistance: function(x1,y1,x2,y2) { return Math.sqrt(Math.square(x2-x1) + Math.square(y2-y1)) },
}

//
// Dilated Time object:
//
var __id = -1;
var tick = 10;
var timer = function(birth,distance,velocity) {
	this.id = ++__id;
	this.distance = distance;
	this.velocity2 = velocity*velocity;
	this.birth = birth;
	this.date = birth;
	this.elapsed = 0;
	this.console = document.createElement("div");
	this.console.id = "c"+this.id;
	this.console.setAttribute("class","console");
	this.clock = document.createElement("div");
	this.clock.id = "t"+this.id;
	this.clock.setAttribute("class","timer");
	this.console.appendChild(this.clock);
	this.width = 306;
	this.height = 76;
	document.body.appendChild(this.console);
	this.start();
}
//gets the dilated elapsed time and returns it as HH:MM:SS.mm
timer.prototype.get = function () {
	var d = new Date(Physics.timeDilation((new Date())-this.birth,this.velocity2));
	this.elapsed = d - 0;
	this.date = d;
	return d.toTimeString();
}
//begins the timer
timer.prototype.start = function () {
	var t = this;
	window.setInterval(function() { 
		t.clock.innerHTML = t.get();
	},tick);
}

//
// Dilators:
//
var Dilators = function() {
	var timers = [];
	return {
		add: function(birth,distance,velocity) {
			var t = new timer(birth,distance,velocity);
			timers.push(t);
			return t;
		},
		each: function (callback) {
			for(var i=0,l=timers.length;i<l;i++) {
				callback(timers[i]);
			}
		}
	}
	
}();



//
// Map Objects to animate:
//

// Gets dots from an image drawn on the canvas, and returns them as an array of sprite objects.  1 dot -> 1 sprite
function getObjects(c, x1, y1, x2, y2, cx, cy) {
	var hasData;
	try {
		var img = c.getImageData(x1, y1, x2, y2).data;
		hasData = true;
	} catch (ex) {
		hasData = false;
	}

	if (!hasData) return null;


	var size = img.length;
	var objects = [];
	var i=0, w=x2-x1, h=y2-y1;
	for (var y=y1;y<y2;y++) {
		for (var x=x1;x<x2;x++) {

			i=((y*w*4)+(x*4));

			if (img[i]<127 || img[i+1]<127 || img[i+2]<127) {
				// 'dot' found, use it as a sprite object
				var id = [x,y].join(',');
				objects[id] = { 
					id:id,
					x:x, 
					y:y, 
					size:6, 
					status:0, 
					direction:1, 
					distance: Physics.coordDistance(x,y,cx,cy)
				}

			}

		}
	}

	return objects;
}

// Animates the sprite objects in a cicular pulse on a scaled canvas, a specified color
function animateObjects(c, obj, rU, sX, sY, color) {

	var radius = 0;
	var sS = (sX+sY)/2;
	var sU = Math.ceil(10 * sS);
	var sL = Math.floor(5 * sS);
	//clone the map, in order to remove nodes on the fly to increase performance.
	var objects = cloneObjects(obj);

	var intID = setInterval(function() {

		if (radius++>rU) {
			//Circle has reached its maximum radius, stop the animation and clean up...
			clearInterval(intID);
			delete objects;
			return false;

		} else {

			for(i in objects) {

				if (objects.hasOwnProperty(i)) {

					var o = objects[i];

					if (o.status==0) {

						if (o.distance<=radius) {
							//The sprite has just reached the expading circle, kick off its individual animation:
							(function(o) {
								o.status = 1;
								//expand out to 10px then in to 5px over 50ms
								o.intID = setInterval(function () {
									var x = o.x * sX - sX, y = o.y * sY - sY, s;
									if (o.size>=10) o.direction=-1;
									o.size+=o.direction;
									s = parseInt(o.size * sS)
									c.clearRect(x, y, s+1, s+1);
									c.fillStyle=color;
									c.fillRect(x, y, s, s);
									if (o.size<=5) { clearInterval(o.intID); delete objects[o.id]; delete o; return false;}

								},50);

							})(o);
						}

					}

				}

			}

		}


	},1);
	
	return intID;

}

// Makes a deep copy of the sprite objects
function cloneObjects(objects) {
	var clone = [];
	for(i in objects) {
		if (objects.hasOwnProperty(i)) {
			var o = objects[i];
			var id = o.id;
			clone[id] = {};
			for(j in o) {
				if (o.hasOwnProperty(j)) {
					var p = o[j];
					(function(id,p) {
						clone[id][j] = p;
					})(id,p);
				}
			}
		}
	}
	return clone;
}

//
// entrypoint, to be called onload
//
function main() {

	var img = new Image();
	img.onload = function() {
		var co = document.getElementsByTagName("canvas");
		if (co.length) {

			//canvas found, initialize and scale
			var C = co[0];
			C.width = img.width;
			C.height = img.height;
			scaleX = width / img.width;
			scaleY = height / img.height;
			centerX = centerX * scaleX - (width - img.width) / 2;
			centerY = centerY * scaleY - (height - img.height) / 2;
			radiusU = parseInt(Math.max(Physics.coordDistance(0,0,centerX,centerY), Physics.coordDistance(width,0,centerX,centerY), Physics.coordDistance(0,height,centerX,centerY), Physics.coordDistance(width,height,centerX,centerY)));
			document.body.style.backgroundColor = "#fff";

			if (C.getContext) {
				//has 2d context
				var c = C.getContext('2d');

				//draw the map
				c.drawImage(img, 0, 0);

				//extract object positions:
				var objects = getObjects(c, 0, 0, img.width, img.height, centerX, centerY);

				//clear the image
				C.width = width;
				C.height = height;

				//construct, add, and position the timers:
				var now = new Date();
				var observer = Dilators.add(now,0,0);
				var informer = Dilators.add(now,_distance,_velocity);
				observer.console.style.top = parseInt((height) / 3).toString() + 'px';
				informer.console.style.top = parseInt((height) / 3).toString() + 'px';
				observer.console.style.left = parseInt((width / 2) - (200+observer.width)).toString() + 'px';
				informer.console.style.left = parseInt((width / 2) + (100)).toString() + 'px';


				//Set pulse animation interval:
				var diff=-1, intID;
				setInterval(function() {
					if (parseInt((informer.elapsed-observer.elapsed)/1000 ) > diff) {
						//difference has increased by at least one second, begin animation:
						diff++;
						var color = (new Date()).toHex();
						intID = animateObjects(c, objects, radiusU, scaleX, scaleY, color);
					}
				},100);


			}
		} else {
			if (error) error("Sorry, canvas could not be initialized.");
		}
	}
	img.src = "images/map.gif";


}