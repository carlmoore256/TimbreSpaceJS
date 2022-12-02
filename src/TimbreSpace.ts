import { Object3D, Raycaster, Color, PerspectiveCamera, Vector, Vector2, Vector3, WebGLRenderer, Mesh, MeshBasicMaterial, SphereGeometry, Shape } from 'three';
import Meyda, { MeydaFeaturesObject } from 'meyda';
import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { VRButton } from 'three/VRButton.js';
import { GrainObject } from './grain.js'

import { ManagedScene } from './ManagedScene';
import { all_features } from './data/config.json';


export class TimbreSpace extends ManagedScene {

    private INTERSECTED : any;
    private raycaster : Raycaster;
    private pointer : Vector2;
    private orbitControls : OrbitControls;
    private centerPos : Vector3;
    static guiData : any;
    private gui : any;

    private isXR : boolean;

    private audioContext : AudioContext;
    private currentSource : any;
    private audioElement : any;

    public soundFile = 'assets/bass.wav';
    public winSize = 2048;
    public hopSize = 512;
    public m_RadiusScl = 5;

    public m_AvgCenter : Vector3;
    static mainGrainModel : Object3D;
    private m_AllGrains : GrainObject[] = [];

    private document : Document;

    private features : any;
    private audioContextRunning : boolean;

    private outputBuffer : AudioBuffer;
    private outputSource : AudioBufferSourceNode;

    private normStats : any = {};

    constructor(width : number, height : number, isXR : boolean, document : Document, soundFile : string)
    {
        super(width, height);
        this.isXR = isXR;
        this.document = document;
        this.audioContextRunning = false;
        this.soundFile = soundFile;
        this.audioContext = new AudioContext();

        this.audioElement = this.document.getElementById("audio");
        this.m_AvgCenter = new Vector3(0,0,0);

    }

    _initRenderer(){
        this.renderer = new WebGLRenderer( { antialias: true, alpha: true });
        (this.renderer as WebGLRenderer).setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( this.width, this.height );
    }

	_initCamera(){
		this.camera = new PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
		this.camera.position.set( 180, 0, 300 );
	}

    _initScene(){
        // scene defined in ManagedScene
        // this.scene.background = new Color( 0x000000 );
        
		this.orbitControls = new OrbitControls( this.camera, this.renderer.domElement );
		this.orbitControls.enableDamping = true;
		this.orbitControls.maxAzimuthAngle = Math.PI * 0.5;
		this.orbitControls.enablePan = true;
		this.orbitControls.screenSpacePanning = true;
        this.orbitControls.autoRotate = true;

		// window.addEventListener( 'resize', onWindowResize );

		this.raycaster = new Raycaster();
        this.pointer = new Vector2(0,0);
        
		this.renderer.domElement.addEventListener( 'mousemove', this.onPointerMove.bind(this) );
        
        window.addEventListener( 'resize', this.onWindowResize );
        this.raycaster = new Raycaster();
        this.document.addEventListener( 'mousemove', this.onPointerMove );
        
        // enable vr rendering if available
        // document.body.appendChild( VRButton.createButton( this.renderer ) );
        // if(this.isXR)
        // {
        //     this.renderer.xr.enabled = true;
        // }
        // this.scene.background = new Color(0x000000)
        this.createGUI();

    }


    createGUI() {
        if (this.gui) this.gui.destroy();

        this.gui = new GUI();

        TimbreSpace.guiData = {
            xAxis : "mfcc_1",
            yAxis : "mfcc_2",
            zAxis : "mfcc_3",
            rColor : "mfcc_4",
            gColor : "mfcc_5",
            bColor : "mfcc_6",
            radius : "rms",
            radiusScale : 5,
            rotate : true,
            maxGrains : 500,
            ctrPos : new Vector3(140,60,32),
        };

        const ctrPosFolder = this.gui.addFolder('Center Pos');
        ctrPosFolder.add(TimbreSpace.guiData.ctrPos, 'x', -360.0, 360.0);
        ctrPosFolder.add(TimbreSpace.guiData.ctrPos, 'y', -360.0, 360.0);
        ctrPosFolder.add(TimbreSpace.guiData.ctrPos, 'z', -360.0, 360.0);
        ctrPosFolder.open();

        const grainModelFolder = this.gui.addFolder('Model Options');
        grainModelFolder.add(TimbreSpace.guiData, 'maxGrains', 0, 5000);
        
        grainModelFolder.add(TimbreSpace.guiData, "xAxis", all_features).name("x-axis feature").onChange( this.updateGrainOrdering );
        grainModelFolder.add(TimbreSpace.guiData, "yAxis", all_features).name("y-axis feature").onChange( this.updateGrainOrdering );
        grainModelFolder.add(TimbreSpace.guiData, "zAxis", all_features).name("z-axis feature").onChange( this.updateGrainOrdering );

        grainModelFolder.add(TimbreSpace.guiData, "rColor", all_features).name("R feature").onChange( this.updateGrainOrdering );
        grainModelFolder.add(TimbreSpace.guiData, "gColor", all_features).name("G feature").onChange( this.updateGrainOrdering );
        grainModelFolder.add(TimbreSpace.guiData, "bColor", all_features).name("B feature").onChange( this.updateGrainOrdering );

        grainModelFolder.add(TimbreSpace.guiData, "rotate").name("Rotate");
        // this.orbitControls.autoRotate
        grainModelFolder.open();

    }

    updateGrainOrdering()
    {
        // if(TimbreSpace.mainGrainModel == undefined)
        //     return;

        // console.log(TimbreSpace.mainGrainModel.children.length);

        console.log(TimbreSpace.mainGrainModel);

        TimbreSpace.mainGrainModel.children.forEach(item => {
            console.log(item);
            item.userData.updateOrdering(
                TimbreSpace.guiData.xAxis,
                TimbreSpace.guiData.yAxis,
                TimbreSpace.guiData.zAxis,
                TimbreSpace.guiData.rColor,
                TimbreSpace.guiData.gColor,
                TimbreSpace.guiData.bColor,
            )
        })
    }

    startAudioContext()
    {
        this.audioContext = new AudioContext();
        this.audioContext.resume();
        // this.audioContext.connect(outputSource);
    }

    // loads an audio file into the context, returns a source
    loadAudioFile(soundFile : string)
    {
        this.audioElement.load();
        this.audioElement.autoplay = true;
        var source = this.audioContext.createMediaElementSource(this.audioElement);
        source.connect(this.audioContext.destination);
        return source
    }


    // audioPlaybackEngine()
    // {
    //     // let buffer : AudioBuffer = this.audioContext.createBuffer(1, 512, );
    //     let channels = 1;

    //     for (var channel = 0; channel < channels; channel++) {
    //         // This gives us the actual ArrayBuffer that contains the data
    //         var nowBuffering = myArrayBuffer.getChannelData(channel);
    //         for (var i = 0; i < frameCount; i++) {
    //             // Math.random() is in [0; 1.0]
    //             // audio needs to be in [-1.0; 1.0]
    //             nowBuffering[i] = Math.random() * 2 - 1;
    //         }
    //     }

    //     // Get an AudioBufferSourceNode.
    //     // This is the AudioNode to use when we want to play an AudioBuffer
    //     var source = audioCtx.createBufferSource();
    //     // set the buffer in the AudioBufferSourceNode
    //     source.buffer = myArrayBuffer;
    //     // connect the AudioBufferSourceNode to the
    //     // destination so we can hear the sound
    //     source.connect(audioCtx.destination);
    //     // start the source playing
    //     source.start();
    // }

    // eventually make grain model its own class
    // returns an object containing all of the grains
    spawnGrainModel(soundFile : string)
    {
        let container = new Object3D();
        this.scene.add(container);
        // extract features
        this.feature_extractor(
            this.loadAudioFile(soundFile), 
            this.winSize, 
            this.hopSize, 
            this.m_RadiusScl, 
            container
        );
        this.scene.add(container);
        return container;
    }

    // get 3D axes from audio features
    feature_extractor(
        source : any,
        winSize : number, 
        hopSize : number, 
        scale : number, 
        container : Object3D) 
    {
        // initialize normalization statistics
        let normStat : { [key: string]: { [key: string]: number } }  = {}; // normStat - dict containing min and max mfcc norm vals
        normStat["max"] = {};
        normStat["min"] = {};
        all_features.forEach(item => {
            normStat.max[item] = 0;
            normStat.min[item] = 0;
        })

        const analyzer = Meyda.createMeydaAnalyzer({
            "audioContext": this.audioContext,
            "source": source,
            "bufferSize": winSize,
            "hopSize": hopSize,
            "featureExtractors": [ "mfcc", "loudness", "buffer", "rms", "chroma" ], //buffer returns raw audio
            "numberOfMFCCCoefficients": 10, //specify max mfcc coeffs
            "callback": (features : Partial<MeydaFeaturesObject>) => {
                console.log("Analyzer callback");
                if (!features || features.rms == 0.) return;
                this.analyzerCallback(features, scale, container, normStat)
            }
        });
        analyzer.start();
    }

    // MeydaFeaturesObject
    // features : Partial<Meyda.MeydaFeaturesObject>
    analyzerCallback(
        features : Partial<MeydaFeaturesObject>, 
        scale : number, 
        container : Object3D, 
        normStat : any)
    {
        
        if (this.audioElement.paused) { return; }

        let featureDict = this.parseFeatures(features, normStat);

        // if(featureDict.mfcc_1 == NaN) { return };        
        if ( featureDict.rms > 0.001)
        {
            let posScalar = 1;
            let colScalar = 0.1;
            
            const position = new Vector3( 
                featureDict[TimbreSpace.guiData.xAxis] * posScalar,  
                featureDict[TimbreSpace.guiData.yAxis] * posScalar,  
                featureDict[TimbreSpace.guiData.zAxis] * posScalar );

            const color = new Color(  
                featureDict[TimbreSpace.guiData.rColor] * colScalar,  
                featureDict[TimbreSpace.guiData.gColor] * colScalar,  
                featureDict[TimbreSpace.guiData.bColor] * colScalar );

            const radius =  featureDict[TimbreSpace.guiData.radius] * TimbreSpace.guiData.radiusScale;

            // remember to add scale eventually
            const geometry = new SphereGeometry( radius, 8, 8 );
            const material = new MeshBasicMaterial( {color: color} );
            var object = new Mesh( geometry, material );

           

            container.add(object);

            var grain = new GrainObject(
                object,
                features.buffer!,
                position,
                radius,
                color,
                featureDict)
            
            if (isNaN(this.m_AvgCenter.x)) { 
                this.m_AvgCenter = new Vector3(0,0,0);
            }

            var newAvg = this.m_AvgCenter.clone().add(position);
            this.m_AvgCenter.set(newAvg.x, newAvg.y, newAvg.z);
            
            // this.m_AllGrains.push(grain);

            // this.m_AllGrains.length
            while (container.children.length > TimbreSpace.guiData.maxGrains)
                this.deleteGrain(container, 0);



            // const circle = new Shape();
            // const x = 0;
            // const y = 0;
            // circle.absarc(0, 0, radius, 0, );
            // const geometry = new THREE.ShapeGeometry(circle, segments / 2);

            // const material = new THREE.MeshBasicMaterial({
            //   color: settings.colors.circle,
            //   side: THREE.DoubleSide,
            //   depthWrite: false
            // });
        
            // const mesh = new THREE.Mesh(geometry, material);
        
            // scene.add(mesh);
        }
    }

    parseFeatures(features : Partial<MeydaFeaturesObject>, normStat : any)
    {
        // get the highest confidence for chroma class
        let pitchClass =  features.chroma!.reduce((iMax : any, x : any, i : any, arr : any) => x > arr[iMax] ? i : iMax, 0);
        // normalize to 0-1
        pitchClass /= 12;

        let featureDict : { [key: string]: number } = {
            "rms" : features.rms!,
            "loudness" : features.loudness?.total!,
            "chroma" : pitchClass,
        };

        for(let i = 0; i < features.mfcc!.length-1; i++)
        {
            let key = "mfcc_" + (i+1);
            let coeff = features.mfcc![i];
            
            if(coeff > normStat.max[key])
            {
                normStat.max[key] = coeff;
            }
            if(coeff < normStat.min[key])
            {
                normStat.min[key] = coeff;
            }
            // normalize mfcc coefficient
            // featureDict[key] = (coeff - normStat.min[key]) / (normStat.max[key] - normStat.min[key]);
            featureDict[key] = coeff;
        }

        return featureDict;
    }

    deleteGrain(container : Object3D, index : number)
    {
        container.children[index].userData.deleteGrain();
        container.remove(container.children[index]);
    }

    _animate() {


        if (TimbreSpace.mainGrainModel != undefined)
        {
            // var centerTarget : Vector3 = this.m_AvgCenter.divideScalar(TimbreSpace.mainGrainModel.children.length);
            // var currentLoc = this.orbitControls.target;
            // var newLoc = currentLoc.lerp(centerTarget, 0.5);
            // this.orbitControls.target.set(centerTarget.x, centerTarget.y, centerTarget.z);

            this.orbitControls.target = TimbreSpace.guiData.ctrPos;
            this.orbitControls.update();

            TimbreSpace.mainGrainModel.children.forEach(item => {
                item.userData.update();
            });
        }

        // this.renderer.setAnimationLoop( function () {
        //     this.renderer.render( this.scene, this.camera );
        // } );
        // // requestAnimationFrame( animate );
        // if (TimbreSpace.mainGrainModel != undefined)
            // TimbreSpace.mainGrainModel.rotation.x += 0.1;
        // this.render();
        // stats.update();
    }

    raycastObjects(pointer : Vector2)
    {
        if (TimbreSpace.mainGrainModel != undefined)
        {
            // console.log(this.pointer);

            this.raycaster.setFromCamera( pointer, this.camera );

            const intersects = this.raycaster.intersectObjects( TimbreSpace.mainGrainModel.children );

            if ( intersects.length > 0 ) {

                if ( this.INTERSECTED != intersects[ 0 ].object ) {

                    this.INTERSECTED = intersects[ 0 ].object;

                    let grain : GrainObject  = this.INTERSECTED.userData;

                    grain.playAudio(1.0);
                }
            } else {
                this.INTERSECTED = null;
            }
        }
    }
	
    onPointerMove( event : any ) {

        if (this.audioContext == undefined)
            return;

        if(this.audioContext.state == "suspended")
        {
            this.startAudioContext();
            this.audioContextRunning = false;
        }

        if(this.audioContext.state == "running" && !this.audioContextRunning)
        {
            this.audioContextRunning = true;
            TimbreSpace.mainGrainModel = this.spawnGrainModel(this.soundFile);
        }

        // this.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        // this.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        let pointer : Vector2 = new Vector2(event.clientX, event.clientY);
        this.raycastObjects(pointer);
    }

    onWindowResize() {
        if (this.renderer == undefined)
            return;

        // if (this.renderer != undefined)
        // {
        //     this.renderer.setSize( window.innerWidth, window.innerHeight );
        // }
        // this.camera.aspect = window.innerWidth / window.innerHeight;
        // this.camera.updateProjectionMatrix();
        // this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    // Existing code unchanged.
    // window.onload = function() {
    //     let audioContext = new AudioContext();
    // }

    // One-liner to resume playback when user interacted with the page.
    // document.querySelector('audio').addEventListener('play', function() {
    //     this.audioContext.resume().then(() => {
    //         console.log('Playback resumed successfully');
    //     });
    // });
}


    // // MeydaFeaturesObject
    // // features : Partial<Meyda.MeydaFeaturesObject>
    // analyzer_callback(
    //     features : Partial<Meyda.MeydaFeaturesObject>, 
    //     scale : number, 
    //     container : Object3D, 
    //     normStat : any)
    // {
    //     if (this.audioElement.paused) { return; }

    //     console.log(features["mfcc"]);
    //     let rms = features.rms;
    //     let mfcc = features.mfcc;
    //     let buffer = features.buffer;
    //     let loudness_ = features.loudness;

    //     // figure out a better way to do this
    //     mfcc = mfcc!;
    //     rms = rms!;
    //     buffer = buffer!;
    //     let loudness = loudness_!.total;
        
    //     if ( rms > 0.001)
    //     {
    //         let posScalar = 1;
    //         let colScalar = 0.1;

    //         if(mfcc[0] == NaN) { return };

    //         // for (let i = 0; i < mfcc.length; i++)
    //         // {
    //         //     if (normStat.mfcc_max[i] > normStat.mfcc_max[i])
    //         //     {

    //         //     }
    //         //     normStat.mfcc_max[i] = Math.max(mfcc[i], normStat.mfcc_max[i]);
    //         //     normStat.mfcc_min[i] = Math.min(mfcc[i], normStat.mfcc_min[i]);
    //         // }

    //         const position = new Vector3(  mfcc[0]*posScalar,  mfcc[1]*posScalar,  mfcc[2]*posScalar );
    //         const color = new Color(  mfcc[3]*colScalar,  mfcc[4]*colScalar,  mfcc[5]*colScalar );
    //         const radius =  rms * scale;

    //         // remember to add scale eventually
    //         const geometry = new SphereGeometry( radius, 8, 8 );
    //         const material = new MeshBasicMaterial( {color: color} );
    //         var object = new Mesh( geometry, material );
    //         // object.parent = TimbreSpace.mainGrainModel;
    //         container.add(object);

    //         var grain = new GrainObject(
    //             object,
    //             buffer,
    //             position,
    //             color,
    //             features)
            

    //         if (isNaN(this.m_AvgCenter.x)) { 
    //             this.m_AvgCenter = new Vector3(0,0,0);
    //         }

    //         var newAvg = this.m_AvgCenter.clone().add(position);
    //         this.m_AvgCenter.set(newAvg.x, newAvg.y, newAvg.z);
            
    //         // this.m_AllGrains.push(grain);

    //         // this.m_AllGrains.length
    //         while (container.children.length > TimbreSpace.guiData.maxGrains)
    //         {
    //             this.deleteGrain(container, 0);
    //             // container.remove(container.children[0]);
    //             // this.deleteGrain(container, this.m_AllGrains.shift()!);
    //         }
    //     }
    // }


    // "mfcc_1" : features.mfcc![0],
    // "mfcc_2" : features.mfcc![1],
    // "mfcc_3" : features.mfcc![2],
    // "mfcc_4" : features.mfcc![3],
    // "mfcc_5" : features.mfcc![4],
    // "mfcc_6" : features.mfcc![5],
    // "mfcc_7" : features.mfcc![6],
    // "mfcc_8" : features.mfcc![7],
    // "mfcc_9" : features.mfcc![8],
    // "mfcc_10" : features.mfcc![9],


            // const grainModelFeatures = [
        //     "rms",
        //     "loudness",
        //     "chroma",
        //     "mfcc_1",
        //     "mfcc_2",
        //     "mfcc_3",
        //     "mfcc_4",
        //     "mfcc_5",
        //     "mfcc_6",
        //     "mfcc_7",
        //     "mfcc_8",
        //     "mfcc_9",
        //     "mfcc_10",
        // ];