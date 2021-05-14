import * as THREE from './three/three.module.js';
import Stats from './three/stats.module.js';
import { OrbitControls } from './three/OrbitControls.js'


let INTERSECTED, raycaster;
const pointer = new THREE.Vector2;

let renderer, stats, scene, camera, guiData;

let m_Grains = [];

init();
animate();

function init() {
	// initialize scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xf0f0f0 );

	// camera and renderer =========
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 0, 0, 200 );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	 document.body.appendChild( renderer.domElement );

	const orbitControls = new OrbitControls( camera, renderer.domElement );
	orbitControls.screenSpacePanning = true;

	// framerate stats =========
	stats = new Stats();
	  document.body.appendChild( stats.dom );

	window.addEventListener( 'resize', onWindowResize );

	// raycasting ==============
	raycaster = new THREE.Raycaster();
	document.addEventListener( 'mousemove', onPointerMove );

	// gui options =========
	guiData = {
		currentSound: './audio/CISSA2.wav',
	};

	spawnGrains();
}

// input link to file, spawn grains in m_Grains
function spawnGrains(audio_file) {
	const geometry = new THREE.SphereGeometry( 5, 32, 32 );
	const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
	const sphere = new THREE.Mesh( geometry, material );
	scene.add( sphere );
}

function onPointerMove( event ) {
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

	requestAnimationFrame( animate );

	render();

	stats.update();

}

function render() {
	// raycastObjects();
	renderer.render( scene, camera );
}

function raycastObjects()
{
  raycaster.setFromCamera( pointer, camera );

  const intersects = raycaster.intersectObjects( components );

  if ( intersects.length > 0 ) {

    if ( INTERSECTED != intersects[ 0 ].object ) {

      INTERSECTED = intersects[ 0 ].object;
    }
  } else {

    INTERSECTED = null;

  }
}
