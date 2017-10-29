/*
	MIT License
	Copyright (c) 2015, Max Irwin
*/


//
// Draws trees to a 3d canvas, using a genetic algorithm
//
var artist = window.artist = (function(){ 

	var scene,camera,renderer,controls;

	var E = function(e){return document.getElementById(e);}; //Shortcut for DOM element
	var _worker, _objBatches = []; 							//worker objects
	var _branchObjects = [], _leafObjects = []; 			//tree objects (for SVG)
	var _w,_h,_generations,_size,_angle,_ratio,_trunk,_twigs,_leaves,_canvas,_c; //private vars

	var settings = function(){
		_canvas = E("c");
		_w = window.innerWidth;
		_h = window.innerHeight;		
		_generations = parseInt(E("generations").value); 	//Iterations through growth 
		_size = parseFloat(E("size").value);				//Initial length of the trunk 
		_angle = parseFloat(E("angle").value); 				//Angle seed for branch direction
		_ratio = parseFloat(E("ratio").value); 				//Ratio seed for length evolution
		_trunk = parseFloat(E("trunk").value); 				//Initial Thickness of the trunk 
		_twigs = parseInt(E("twigs").value);   				//Not used yet
		_leaves = parseFloat(E("leaves").value); 			//Initial Size of the leaves


		scene = new THREE.Scene();
		scene.fog = new THREE.Fog( 0xcce0ff, 0, _h*3 );

		camera = new THREE.PerspectiveCamera( 90, _w / _h, 0.1, _w*2 );
		//camera = new THREE.OrthographicCamera( _w / - 2, _w / 2, _h / 2, _h / - 2, 1, 1000 );
		//scene.add(camera);

		camera.position.x = _w;
		camera.position.y = _h*2;
		camera.position.z = _w;
		camera.lookAt(new THREE.Vector3( 0,0,0 ));

		controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;

		var groundMaterial = new THREE.MeshPhongMaterial( { color: 0x33cc33, specular: 0x111111 } );

		var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
		mesh.position.y = _h;
		mesh.rotation.x = - Math.PI / 2;
		mesh.receiveShadow = true;
		scene.add( mesh );		



		var skyMaterial = new THREE.MeshPhongMaterial( { color: 0x3333cc, specular: 0x111111 } );

		// build the skybox Mesh 
		sky = new THREE.Mesh( new THREE.CubeGeometry( 100000, 100000, 100000, 0-_w, 0-_h, 0-_w, null, true ), skyMaterial );

		scene.add( sky );


		scene.add( new THREE.AmbientLight( 0xdddddd ) );


		renderer = new THREE.WebGLRenderer();
		renderer.setSize( _w, _h );
		_canvas.appendChild( renderer.domElement );


		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		document.body.appendChild( stats.domElement );

	};


	//Draw branch with thickness w
	var drawBranch = function(branch){

		var material = new THREE.LineBasicMaterial({
			color: 0x333333
			,linewidth: branch.width/10
		});

		var geometry = new THREE.Geometry();
		geometry.vertices.push(
			new THREE.Vector3( branch.x1, branch.y1, branch.z1 ),
			new THREE.Vector3( branch.x2, branch.y2, branch.z2 )
		);

		var line = new THREE.Line( geometry, material );
		scene.add( line );
	};

	//Draw leaf with radius r
	var drawLeaf = function(leaf){
		/*
		_c.beginPath();
		_c.strokeStyle = leaf.stroke;
		_c.fillStyle = leaf.color;
		_c.arc(leaf.x,leaf.y,leaf.r,0,leaf.circ,true);
		_c.lineWidth=0.5;
		_c.stroke();
		_c.fill();
		_c.closePath();
		*/

		var ballGeo = new THREE.SphereGeometry( leaf.r, leaf.r, leaf.r );
		var ballMaterial = new THREE.MeshPhongMaterial( { color: 0x00cc00 } );

		sphere = new THREE.Mesh( ballGeo, ballMaterial );
		sphere.castShadow = true;
		sphere.receiveShadow = true;
		sphere.position.x = leaf.x;
		sphere.position.y = leaf.y;
		sphere.position.z = leaf.z;
		scene.add( sphere );

	};

	//Interval to draw objects to canvas, one batch at a time
	var drawInterval = function() {
		if(_objBatches.length) {
			var batch = _objBatches.pop();
			for(var i=0,l=batch.length;i<l;i++) {
				var obj = batch[i];
				switch(obj.type) {
					case 'branch':
						_branchObjects.push(obj);
						drawBranch(obj);
						break;
					case 'leaf':
						_leafObjects.push(obj);
						drawLeaf(obj);
						break;
				}
			}
		}
	}


	//Rendering Animation
	var render = function() {

		controls.update();

		renderer.render(scene, camera);

	};

	var animate = function() {

		requestAnimationFrame( animate );

		render();

		stats.update();

	};

	//Callback fired when message received from worker
	var workerEvent = function(e) {

		var data = e.data;
		switch(data.action) {

			case 'batch':
				//push the received batch onto the stack
				_objBatches.push(data.batch);
				break;

			case 'status':
				//Start the worker if its not running
				if(data.status!=='running') {
					_branchObjects = [];
					_leafObjects = [];
					_worker.postMessage({action:'draw',width:_w,height:_h,generations:_generations,size:_size,angle:_angle,ratio:_ratio,trunk:_trunk,twigs:_twigs,leaves:_leaves});
				}
				break;
		}
		
	};

	//Gets the settings and starts the worker
	var draw = function() {
		settings();
		
		if(!_worker) {
			//Initialize worker
			_worker = new Worker("/javascripts/artistworker3.js");
			_worker.addEventListener('message',workerEvent);
		}		
 
 		//Send a status request to the thread
		_worker.postMessage({action:'status'});
		
	}

	//initialize the UI
	var init = function(){

		//Initialize and get the original settings from the UI
		var set = E("settings");
		var lis = set.getElementsByTagName("input");
		for(var i=0,l=lis.length;i<l;i++) {
			var gauge = new Setting(lis[i], draw);
		}

		setInterval(drawInterval, 5);

		//start it up!		
		draw();

		//Start the draw interval
		animate();
		
	};

	//Preps the image for user download
	var savePNG = function(){
		var uri = _canvas.toDataURL("image/png").replace("image/png","image/octet-stream");
		document.location.href=uri;
	};


	//Toggle about section
	var about = function() {
		var a = E("about");
		var d = a.style.display;
		a.style.display = (d=="none"||d=="")?"block":"none";
	}

	return {
		init:init,
		about:about,
		savePNG:savePNG
	} 

 })(); 