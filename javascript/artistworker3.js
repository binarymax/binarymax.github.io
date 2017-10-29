/*
	MIT License
	Copyright (c) 2012, Max Irwin
*/

//
// Includes
//
importScripts('tree.js');

//
// Draws trees branch by branch as a web worker, using a genetic algorithm
//
var artistWorker = (function(){ 
	"use strict";

	Math.Tau = Math.Tau || (2*Math.PI);

	var _isRunning = false;
	var _maxCount  = 255;
	var _objQueue  = [];
	var _objCount  = 0;
	var _w,_h,_d,_generations,_size,_angle,_ratio,_trunk,_twigs,_leaves; 
	
	//(Re)initializes environment
	var init = function(height,width,depth,generations,size,angle,ratio,trunk,twigs,leaves){
		_h = height;
		_w = width;
		_d = depth;
		_generations = generations; 	//Iterations through growth 
		_size = size;					//Initial length of the trunk 
		_angle = angle; 				//Angle seed for branch direction
		_ratio = ratio; 				//Ratio seed for length evolution
		_trunk = trunk; 				//Initial Thickness of the trunk 
		_twigs = twigs;   				//Starting branch depth that has leaves
		_leaves = leaves;				//Initial Size of the leaves
	};
	
	//Converts polar coordinates to cartesian
	var cartesian = function(t,a,r,x,y,z){

		//Get base cartesian around 0,0,0 axis

		// x = r * cos(theta) * sin(azimu)
		// y = r * sin(theta) * sin(azimu) 
		// z = r * cos(theta)

		var theta = t * Math.Tau / 360;
		var azimu = a * Math.Tau / 360;

	 	var x1 = Math.floor(r * Math.cos(theta) * Math.sin(azimu));
	 	var y1 = Math.floor(r * Math.sin(theta) * Math.sin(azimu));
	 	var z1 = Math.floor(r * Math.cos(azimu));

	 	//Map to x,y,z arguments:
		x1+=x||0;
		y1+=y||0;
		z1+=z||0;
		return {x:x1,y:y1,z:z1};
		

	};
	
	//Gets a random number between a and b
	var range = function(a,b) {
		return parseInt((Math.random() * (b-a)) + a);
	};

	
	//Gets a variation on a base rgb color
	var colorRange = function(r,g,b,n) {
		n = n||20;
		r = parseInt(Math.abs(range(r-n,r+n)));
		g = parseInt(Math.abs(range(g-n,g+n)));
		b = parseInt(Math.abs(range(b-n,b+n)));
		return "#" + r.toString(16) + g.toString(16) + b.toString(16);
	};

	//Gets a variation on a base rgb color
	var greyRange = function(g,n) {
		n = n||20;
		g = parseInt(Math.abs(range(g-n,g+n))).toString(16);
		g = (g.length>1?'':'0') + g;
		g = "#" + g + g + g;
		return g;
	};

	//Draw branch with thickness w
	var queueBranch = function(x1,y1,z1,x2,y2,z2,w,c){
		_objQueue[_objCount++] = {type:'branch',x1:x1,y1:y1,z1:z1,x2:x2,y2:y2,z2:z2,width:w,color:"#111111"};
	};

	//Draw leaf with radius r
	var queueLeaf = function(x1,y1,z1,r){
		_objQueue[_objCount++]={type:'leaf',x:x1,y:y1,z:z1,r:r,circ:Math.Tau,color:colorRange(50,200,50),stroke:"#333333"};
	};

	//Sends a batch of objects back to the window, resets for next batch
	var sendObjects = function() {
		self.postMessage({action:'batch',batch:_objQueue});
		_objQueue = [];
		_objCount = 0;
	};

	//Grow the tree by one branch
	var grow = function(branch) {
		if(!branch.grown) {
			var d1,d2,d3,d4,lp,wp,rp,bp,cp,cc;
			var angle = (Math.random()*_angle) + (_angle/2);  //fans out the branches
			var azimu = (Math.random()*_angle) + (_angle/2);  //fans out the branches
			var ratio = _ratio + Math.random()/8;
			
			//evolve from parent:
			lp = branch.l*ratio;  //length
			wp = branch.w*_ratio;  //thickness
			rp = branch.r*_leaves; //leaves
			bp = branch.Branch+1;  //branch number

			d1 = branch.d-angle;   //branch angle 1
			d2 = branch.d+angle;   //branch angle 2
			d1 = (d1<0)?d1+360:d1;
			d2 = (d2>=360)?d2-360:d2;
						
			d3 = branch.a-azimu;   //branch angle 1
			d4 = branch.a+azimu;   //branch angle 2
			d3 = (d3<0)?d3+360:d3;
			d4 = (d4>=360)?d4-360:d4;


			cp = cartesian(branch.d,branch.a,lp,branch.x,branch.y,branch.z);

			//Queue the branch
			queueBranch(branch.x,branch.y,branch.z,cp.x,cp.y,cp.z,wp,cc);
			
			//Queue the leaf		
			if(branch.depth>=(15-_twigs)) queueLeaf(cp.x+parseInt(range(1,5)),cp.y+parseInt(range(1,5)),cp.z+parseInt(range(1,5)),rp);
			
			if(_objCount>_maxCount) sendObjects();

			//Add 2 child branches to current branch
			branch.addChild({x:cp.x,y:cp.y,z:cp.z,d:d1,a:d3,l:lp,w:wp,r:rp});
			branch.addChild({x:cp.x,y:cp.y,z:cp.z,d:d2,a:d4,l:lp,w:wp,r:rp});
			//branch.addChild({x:cp.x,y:cp.y,z:cp.z,d:d1,a:d3,l:lp,w:wp,r:rp});
			//branch.addChild({x:cp.x,y:cp.y,z:cp.z,d:d1,a:d2,l:lp,w:wp,r:rp});
			
			//flag that this branch has grown, so it doesn't grow more!
			branch.grown=1;
		}
	}; 

	//Generates and draws a unique tree
	var draw = function(){ 	
	
		//Start in the bottom center, with an upward pointing trunk
		var x = _w>>1, y = _h, z = _d, d = 90, a = 90; 

		_isRunning = true;

		//Make the root node
		var tree = Tree.makeNode({x:x, y:y, z:z, d:d, a:a, l:_size, w:_trunk, r:_leaves});
		
		//Grow the tree!
		for(var i=0;i<_generations;i++) { 
			tree.traverse(grow);
		}

		sendObjects();
		
		_isRunning = false;

		return false;
	};
	
	var status = function() {
		return _isRunning?'running':'idle';
	}	
	
	return {
		init:init,
		draw:draw,
		status:status
	}

 })();

 
//
// Worker message event:
//
self.addEventListener('message',function(e) {
 	
 	var d = e.data;

 	switch(d.action) {

		case 'draw':
			//set params and start drawing!
			artistWorker.init(d.height,d.width,d.width,d.generations,d.size,d.angle,d.ratio,d.trunk,d.twigs,d.leaves);
			if(artistWorker.status()!=='running') artistWorker.draw();
			break;
	
		case 'status':
			self.postMessage({action:'status',status:artistWorker.status()});
			break;

		case 'stop':
			self.close();
			break;

 	}

 });