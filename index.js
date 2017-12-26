var binarymax = window.binarymax = {};
binarymax.circus=(function(){
	"use strict";

	var head = document.getElementById("head");
	var logo = document.getElementById("logo");
	var anim = document.getElementById("anim");
	var year = document.getElementById("year");
	var cont = anim.getContext('2d');
	var back = "";

	var dim = 75;
	anim.width = dim;
	anim.height = dim;
	 
	var imgd = cont.createImageData(dim,dim);

	var memo = [dim*dim];
	var frms = [];

	year.innerText = (new Date()).getFullYear();

	var load = function() {
		logo.onclick = S;
		for(var x=0;x<dim;x++){
			for(var y=0;y<dim;y++){
				var offset=(x+y*dim)*4;
				memo[offset] = {
					r:parseInt((x^y)),
					g:parseInt((x|y)),
					b:parseInt((x&y))
				};
			}
		}

		for(var z=0;z<dim;z++) {
			drawImage(z);
		}

		requestAnimationFrame(animate);
	};

	var drawImage = function (z) {
		var pix = imgd.data;
		for(var x=0;x<dim;x++) {
			for(var y=0;y<dim;y++) {
				var offset=(x+y*dim)*4;
				pix[offset+0]=(memo[offset].r * z)%255;
				pix[offset+1]=(memo[offset].g * z)%255;
				pix[offset+2]=(memo[offset].b * z)%255;
				pix[offset+3]=255;
			}
		}
		cont.putImageData(imgd, 0,0);
		back = anim.toDataURL();
		frms.push('url('+back+')');
	};

	var frm = 0, dir = 1, wait = 0;
	var animate = function(){
		if(wait==5) {
			logo.style.backgroundImage=frms[frm];
			frm += dir;
			wait=0;
		}
		wait++;
		if(frm === dim) dir = -1;
		if(frm === 0)   dir = 1;
		requestAnimationFrame(animate);
	};

	var B = 1;
	var S = function(){
		B = B^1;
		logo.src='http://binarymax.com/images/binarymax_orange'+B+'.png';
	}

	load();

})();