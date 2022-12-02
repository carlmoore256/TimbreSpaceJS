import * as THREE from "three";
import { Object3D } from "three";
/** base class to help create threejs scenes */
export class ManagedScene {
    public scene: THREE.Scene;
    public camera: THREE.Camera;
    public renderer: THREE.Renderer;

    private objects: Record<string, Object3D> = {};
    private paused = true;
    protected frame = 0;

    constructor(protected width: number, protected height: number) {
        // requestAnimationFrame changes context so we need to bind the "this" param
        this.animate = this.animate.bind(this);
    }

    /** initialize renderer, camera, and scene */
    init() {
        this._initRenderer();
        this._initCamera();
        this.scene = new THREE.Scene();
        this._initScene();
    }

    /** default implementation uses WebGLRenderer with transparent background */
    protected _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.renderer.setSize(this.width, this.height);
    }

    protected _initCamera() {
        const aspectRatio = this.width / this.height;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    }

    protected _initScene() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        const cube = new THREE.Mesh(geometry, material);
        this.objects.cube = cube;
        this.scene.add(cube);
        this.camera.position.z = 5;
    }

    start() {
        this.paused = false;
        this.animate();
    }

    pause() {
        this.paused = true;
    }

    /** don't override this, override _animate instead */
    private animate() {
        if (this.paused) return;
        this.renderer.render(this.scene, this.camera);
        this._animate();
        this.frame++;
        requestAnimationFrame(this.animate);
    }

    /** override in child class */
    protected _animate() {
        // const cube = this.objects.cube;
        // cube.rotation.x += 0.01;
        // cube.rotation.y += 0.01;
    }

    // protected onWindowResize() {
    //     // this.camera.aspect = window.innerWidth / window.innerHeight;
    //     // this.camera.updateProjectionMatrix();
    //     this._initRenderer();
    //     this.renderer.setSize( window.innerWidth, window.innerHeight );
    // }

    /**
     * note: requires init to be called first
     */
    getDOMElement(): HTMLCanvasElement {
        return this.renderer.domElement;
    }
}