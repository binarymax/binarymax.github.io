/*******************************************
*
* palette.js
*
* Copyright(c) 2011, Max Lovenheim Irwin
*
*  - Required: scriptarmyknife.js
*
*******************************************/

var WCAG_CR = 4.5; //Minimum Contrast Ratio as specified in WCAG 2.0

var hashSimilar = [];
var hashExcluded = [];
var setExcluded = new Set();

for(var i=0,l=setExcluded.length;i<l;i++) {hashExcluded[setExcluded[i]]=getColor(setExcluded[i]);}

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
				scrapeTheme(p);
			} else {
				document.body.innerHTML+="Canvas is not supported in your browser";
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
			} else {
				var p = {color:h, count:1, percent:1/(size/4), r:img[i], g:img[i+1], b:img[i+2] };
				if (!isExcluded(p,tolerance)) {
					p.lum = getLuminance(p.r, p.g, p.b);
					pal.push(h);
					hashpal[h] = p;
					if (!palette.length) { palette.push(p); }
				}
			}
		}
	}
	
	
	for(var i=1, k=1, l=pal.length; i<l; i++) {
		var similar = false, excluded=false;
		for(var j=0; j<k; j++) {
			if (palette[j].color!=hashpal[pal[i]].color) {
				if (isSimilar(hashpal[pal[i]], palette[j], tolerance)) {
					similar = true;
					j=k;
				}

			}
			
		}
		if (!similar) {
			palette.push(hashpal[pal[i]]);
			k++;
		}
	}
	qsort(palette, 0, palette.length, function(p1,p2) { return (p1.count>p2.count); });
	qsort(palette, 1, palette.length, function(p1,p2) { return (p1.lum<p2.lum); });
	return palette;
}

function drawPalette(palette) {
	if (!palette.length) return;
	//if (palette[0].lum<0.001) { palette.unshift(palette[palette.length-1]); palette.splice(palette.length-1,1); }
	//if (palette[0].lum<0.01) { palette.swap(0,1); palette.swap(1,2); }
	
	var width = 300, height=20;
	var swatches = document.getElementById("swatches");
	var container = document.createElement("div");
	container.style.width = width + 'px';
	container.style.border = '1px solid #000000';
	for(var i=0, l=palette.length; i<l; i++) {
		var d = document.createElement("div");
		var p = palette[i];
				
		d.style.width = width + 'px';
		d.style.height = height;
		d.style.backgroundColor = '#' + p.color;
		//d.innerHTML = p.lum;
		//d.innerHTML = p.color;
		d.innerHTML = "&nbsp;";
				
		container.appendChild(d);
	}
	swatches.innerHTML = "";
	swatches.appendChild(container);
}

function scrapeTheme(palette) {
	if (!palette.length) return;
	if (palette.length<2) return;
	var preview = document.getElementById("preview");
	var backColor = "#" + palette[0].color;
	var textColor = "#" + palette[palette.length-1].color;
	preview.style.backgroundColor = backColor;
	preview.style.color = textColor;
	preview.style.display = "block";
	
	if (palette.length<3) return;
	var smlrColor = "#" + palette[1].color, stxtColor = textColor;
	//if (getContrastRatio(getColor(textColor),palette[1])<WCAG_CR) { stxtColor = "#" + palette[2].color; }
	var h1 = preview.getElementsByTagName("h1")[0];
	var h2 = preview.getElementsByTagName("h2")[0];
	var d1 = preview.getElementsByTagName("div")[0];
	var d2 = preview.getElementsByTagName("div")[1];
	d1.style.backgroundColor = smlrColor;
	d2.style.backgroundColor = smlrColor;
	d1.style.color = stxtColor;
	d2.style.color = stxtColor;
	
	if (palette.length<4) {preview.style["borderTop"]=preview.style["borderBottom"]=d1.style["borderTop"]=d2.style["borderTop"]="none";  return; }
	var brdrColor = "#" + palette[2].color;
	preview.style["borderTop"] = "10px solid " + brdrColor;
	preview.style["borderBottom"] = "10px solid " + brdrColor;
	
	if (palette.length<5) {d1.style["borderTop"]=d2.style["borderTop"]="none";  return; }
	var seprColor = "#" + palette[3].color;
	d1.style["borderTop"] = "10px solid " + seprColor;
		
	if (palette.length<6) {d2.style["borderTop"]="none";  return; }
	var brkrColor = "#" + palette[4].color;
	d2.style["borderTop"] = "10px solid " + brkrColor;
	
}

function isSimilar(p1,p2,tolerance) {
	if (hashSimilar[p1.color+p2.color]) return true;
	var difference = getDifference(p1,p2);
	var similar = difference<tolerance;
	if (similar) hashSimilar[p1.color+p2.color] = difference;
	return similar;
}

function isExcluded(p,tolerance) {
	if (setExcluded.indexOf(p.color)>-1) return true;
	for(var i=0,l=setExcluded.length;i<l;i++) {
		if (isSimilar(p,hashExcluded[setExcluded[i]],tolerance)) {
			return true;
		}
	}
	return false;
}

function getDifference(p1,p2) {
	return (
		Math.pow(p1.r - p2.r, 2) +
		Math.pow(p1.g - p2.g, 2) +
		Math.pow(p1.b - p2.b, 2)
	);
}

function getColor(s) {
	var i = (s.indexOf('#')==-1)?0:1;
	var r = parseInt(s.substr(i,2),16);
	var g = parseInt(s.substr(i+2,2),16);
	var b = parseInt(s.substr(i+4,2),16);
	return {color:s,r:r,g:g,b:b}
}


function getContrastRatio(p1,p2) {
  //WCAG is 4.5:1
  var l1 = getLuminance(p1.r, p1.g, p1.b) + 0.05;
  var l2 = getLuminance(p2.r, p2.g, p2.b) + 0.05;

  return (l1 > l2) ? l1/l2 : l2/l1; 

}

function getLuminance(r,g,b) {

   r = r/255;
   g = g/255;
   b = b/255;

   r = (r <= 0.03928) ? r/12.92 : Math.pow (((r + 0.055) / 1.055), 2.4);
   g = (g <= 0.03928) ? g/12.92 : Math.pow (((g + 0.055) / 1.055), 2.4);   
   b = (b <= 0.03928) ? b/12.92 : Math.pow (((b + 0.055) / 1.055), 2.4);

   return  0.2126 * r + 0.7152 * g + 0.0722 * b

}