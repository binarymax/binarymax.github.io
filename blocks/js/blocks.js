var blocks = (function(){

	var container, stats;
	var camera, controls, scene, renderer;

	var mouseX = 0,mouseY = 0;
	var offset = new THREE.Vector3( 10, 10, 10 );

	var width = window.innerWidth;
	var height = window.innerHeight;
	var windowHalfX = width>>1;
	var windowHalfY = height>>1;

	init();
	animate();

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	function init() {

		var size = 24;
		var size3 = size*size*size;

		container = $( '#container' );

		camera = new THREE.PerspectiveCamera( 70,  width / height, 1, 10000 );
		camera.position.z = size*2;

		controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;

		scene = new THREE.Scene();

		pickingScene = new THREE.Scene();
		pickingTexture = new THREE.WebGLRenderTarget( width, height );
		pickingTexture.generateMipmaps = false;

		scene.add( new THREE.AmbientLight( 0x999999 ) );

		var geometry = new THREE.BoxGeometry( 1,1,1 );
		var material = new THREE.MeshNormalMaterial();
		var group = new THREE.Object3D();

		var s = 1;
		var t = 3;
		for (var x=0;x<size;x++) {
			var x3 = x*x*x;
			var sx = x * s;
			var xr = x/Math.PI;
			
			for(var y=0;y<size;y++) {
				var y3 = y*y*y;
				var sy = y * s;
				var yr = y/Math.PI;


				for (var z=0;z<size;z++) {
					var z3 = z*z*z;
					var sz = z * s;
					var zr = z/Math.PI;

					if ((x<t || x>size-t) || (y<t || y>size-t) || (z<t || z>size-t)) {

						var cr = Math.floor(Math.sin(x3|y3|z3)*256);
						var cg = Math.floor(Math.cos(x3&y3&z3)*256);
						var cb = Math.floor(Math.sin(x3^y3^z3)*256);

						var color = toHex(cr,cg,z3);

						if (color && color>50) {
							
							var material = new THREE.MeshBasicMaterial( {color:color} );

							var mesh = new THREE.Mesh( geometry, material );

							mesh.position.x = sx;
							mesh.position.y = sy;
							mesh.position.z = sz;
							
							mesh.scale.x = 1;
							mesh.scale.y = 1;
							mesh.scale.z = 1;

							mesh.matrixAutoUpdate = false;
							mesh.updateMatrix();

							group.add( mesh );

						}

					}

				}
			}
		}

		scene.add(group);

		renderer = new THREE.WebGLRenderer();
		renderer.setClearColor( 0xffffff );
		renderer.setSize( width,height );
		renderer.sortObjects = false;

		container.appendChild( renderer.domElement );

		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.zIndex = 100;
		container.appendChild( stats.domElement );


	}

	function toHex(r,g,b) {
		return ((r%256)<<16) + ((g%256)<<8) + (b%256);
	};

	function onDocumentMouseMove(event) {

		mouseX = ( event.clientX - windowHalfX );
		mouseY = ( event.clientY - windowHalfY );

	}

	function animate() {

		requestAnimationFrame( animate );

		render();
		stats.update();

	}

	function render() {

		camera.position.x += (   mouseX - camera.position.x ) * .05;
		camera.position.y += ( - mouseY - camera.position.y ) * .05;

		camera.lookAt( scene.position );

		renderer.render( scene, camera );

	}



})();