//Version 0.1
var hashsimilar = [];

function loadimage(url) {
	var img = new Image();
	img.onload = function() {
		var co = document.getElementsByTagName("canvas");
		if (co.length) {
			var C = co[0];
			if (C.getContext) {
				var c = C.getContext('2d');
				C.width = img.width;
				C.height = img.height;
				c.drawImage(img, 0, 0);
				var p = getPalette(c, 0, 0, img.width, img.height);
				drawPalette(p);
			} else {
				document.body.innerHTML+="Canvas is not supported";
			}
			
		}
	}
	img.src = url;
}

function getPalette(c, x1, y1, x2, y2) {
	var hashpal = new Array();
	var pal = new Array();
	var img = c.getImageData(x1, y1, x2, y2).data;
	var size = img.length;
	var palette = [];
	var tolerance = 0.1 * ( 255 * 255 * 3 );
	
	for (var i=0, l=size; i<l; i+=4) {
		var h = img[i].toHex() + img[i+1].toHex() + img[i+2].toHex();
		if (h) {
			if (hashpal[h]) {
				hashpal[h].percent=(++hashpal[h].count)/(size/4);
				//if (palette[0].count<hashpal[h].count) palette[0] = hashpal[h];
			} else { 
				pal.push(h);
				hashpal[h] = {color:h, count:1, percent:1/(size/4), r:img[i], g:img[i+1], b:img[i+2] };
				if (!palette.length) palette.push(hashpal[h]);
			}
		}
	}
	
	
	for(var i=1, k=1, l=pal.length; i<l; i++) {
		var similar = null;
		for(var j=0; j<k; j++) {
			if (palette[j].color!=hashpal[pal[i]].color) {
				if (isSimilar(palette[j], hashpal[pal[i]], tolerance)) {
					similar = palette[j];
					j=k;
				}
			}
		}
		if (!similar) {
			palette.push(hashpal[pal[i]]);
			k++;
		}
	}
	qsort(palette, 0, palette.length, function(p1,p2) { return (p1.percent>p2.percent); });
	return palette;
}

function drawPalette(palette) {
	var width = 300, height=20;
	var swatches = document.getElementById("swatches");
	var container = document.createElement("div");
	container.style.width = width + 'px';
	container.style.border = '1px solid #000000';
	for(var i=0, l=palette.length; i<l; i++) {
		var d = document.createElement("div");
		var p = palette[i];
				
		//d.style.width = (width * p.percent).toString()  + 'px';
		d.style.width = width + 'px';
		d.style.height = height;
		d.style.backgroundColor = '#' + p.color;
		//d.innerHTML = p.color;
		d.innerHTML = "&nbsp;";
				
		container.appendChild(d);
	}
	swatches.innerHTML = "";
	swatches.appendChild(container);
}


function isSimilar(p1,p2,tolerance) {
	if (hashsimilar[p1.color+p2.color]) return true;
	var difference = (
		Math.pow(p1.r - p2.r, 2) +
		Math.pow(p1.g - p2.g, 2) +
		Math.pow(p1.b - p2.b, 2)
	);
	var similar = difference<tolerance;
	if (similar) hashsimilar[p1.color+p2.color] = difference;
	return similar;
	
}

Number.prototype.toHex = function() {
	var s = this.toString(16);
	return ((s.length==1)?'0'+s:s);
}


// QUICKSORT - algorithm adapted from:
// http://en.literateprograms.org/Quicksort_(JavaScript)
Array.prototype.swap=function(a, b)
{
	var tmp=this[a];
	this[a]=this[b];
	this[b]=tmp;
}

function partition(array, begin, end, pivot, test)
{
	var piv=array[pivot];
	array.swap(pivot, end-1);
	var store=begin;
	var ix;
	for(ix=begin; ix<end-1; ++ix) {
		if(test(array[ix],piv)) {
			array.swap(store, ix);
			++store;
		}
	}
	array.swap(end-1, store);

	return store;
}

function qsort(array, begin, end, test)
{
	if(end-1>begin) {
		var pivot=begin+Math.floor(Math.random()*(end-begin));

		pivot=partition(array, begin, end, pivot, test);

		qsort(array, begin, pivot, test);
		qsort(array, pivot+1, end, test);
	}
}