import * as THREE from './three/three.module.js';
import Stats from './three/stats.module.js';
import { OrbitControls } from './three/OrbitControls.js'
import { VRButton } from './three/VRButton.js';

let INTERSECTED, raycaster;
const pointer = new THREE.Vector2;

let audioContext, source;

let m_MaxGrains = 10;
let m_RadiusScl = 5;

let renderer, stats, m_Scene, camera, guiData, m_GrainParent;

let m_AvgCenter = new THREE.Vector3();

let m_Grains = [];

init();
animate();


function init() {
	// initialize scene
	m_Scene = new THREE.Scene();
	m_Scene.background = new THREE.Color( 0x000000 );

	// camera and renderer =========
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 0, 0, 200 );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// enable VR rendering ======
	document.body.appendChild( VRButton.createButton( renderer ) );
	renderer.xr.enabled = true;

	const orbitControls = new OrbitControls( camera, renderer.domElement );
	orbitControls.screenSpacePanning = true;

	// framerate stats =========
	// stats = new Stats();
  // document.body.appendChild( stats.dom );

	window.addEventListener( 'resize', onWindowResize );

	// raycasting ==============
	raycaster = new THREE.Raycaster();
	document.addEventListener( 'mousemove', onPointerMove );

	// gui options =========
	guiData = {
		currentSound: './audio/WackyDrumsBF16.wav',
		bufferSize: 2048,
		hopSize: 512,
	};

	document.getElementById("audio_src").src = guiData.currentSound;
	document.getElementById("audio_src").load();

	// audio context
	// audioContext
	const htmlAudioElement = document.getElementById("audio_src");
	audioContext = new AudioContext();
	source = audioContext.createMediaElementSource(htmlAudioElement);
	source.connect(audioContext.destination);



	// let color = new THREE.Color( 0, 0, 0 );
	// const geometry = new THREE.SphereGeometry( 1, 8, 8 );
	// const material = new THREE.MeshBasicMaterial( {color: color} );
	// let object = new THREE.Mesh( geometry, material );
	// m_Scene.add(object);

	m_GrainParent = new THREE.Object3D();
	m_Scene.add(m_GrainParent);

	audioContext.resume();
	// set up the feature extractor with callback
	// for generating new grains (audio must be playing)
	feature_extractor();
}

// get 3D axes from audio features
function feature_extractor()
{
	let mfcc_coeffs = [];

	const analyzer = Meyda.createMeydaAnalyzer({
		"audioContext": audioContext,
		"source": source,
		"bufferSize": guiData.buffSize,
		"hopSize": guiData.hopSize,
		"featureExtractors": [ "mfcc", "loudness", "buffer", "rms" ], //buffer returns raw audio
		"numberOfMFCCCoefficients": 6, //specify max mfcc coeffs
		"callback": features => {

			if (features.rms > 0.001)
			{
				let posScalar = 1;
				let colScalar = 0.1;

				let position = new THREE.Vector3( features.mfcc[0]*posScalar, features.mfcc[1]*posScalar, features.mfcc[2]*posScalar );
				let color = new THREE.Color( features.mfcc[3]*colScalar, features.mfcc[4]*colScalar, features.mfcc[5]*colScalar );

				let radius = features.rms * m_RadiusScl;

				// color.setHex(0x44aa88);

				// console.log(color);

				// remember to add scale eventually
				const geometry = new THREE.SphereGeometry( radius, 8, 8 );
				const material = new THREE.MeshBasicMaterial( {color: color} );
				let object = new THREE.Mesh( geometry, material );
				object.parent = m_GrainParent;
				// object.position.set(position.x, position.y, position.z);


				let grain = new GrainObject(
					object,
					features.buffer,
					position,
					color,
					features
				)

				m_Scene.add(object);
				m_Grains.push(grain);
			}

		}
	});
	analyzer.start();
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

	renderer.setAnimationLoop( function () {

		renderer.render( m_Scene, camera );

	} );

	// requestAnimationFrame( animate );

	render();
	// stats.update();
	// let index = m_Grains.length-1;
	// while (m_Grains.length > m_MaxGrains)
	// {
	//
	// 	m_Scene.remove(m_Grains[m_Grains.length-1].object);
	// 	m_Grains.splice(0, 1)
	// }

}

function render() {
	// raycastObjects();
	renderer.render( m_Scene, camera );
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

// Existing code unchanged.
window.onload = function() {
  let audioContext = new AudioContext();
}

// One-liner to resume playback when user interacted with the page.
document.querySelector('audio').addEventListener('play', function() {
  audioContext.resume().then(() => {
    console.log('Playback resumed successfully');
  });
});
