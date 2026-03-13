import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { Injection } from "./utils/injection.js";
import fragmentShader from "./shaders/fragment.glsl";
import vertexShader from "./shaders/vertex.glsl";
import {
  OrbitControls,
  RGBELoader,
  SepiaShader,
  VignetteShader,
} from "three/examples/jsm/Addons.js";
import { GUI } from "lil-gui";
import { AmbientLight } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { SphereGeometry } from "three";
import { MeshStandardMaterial } from "three";
import { Mesh } from "three";
import { Group } from "three";
import { Uniform } from "three";
import { ShaderMaterial } from "three";
import { Color } from "three";

const { PI } = Math;

const canvas = document.querySelector("canvas");

const lil = new GUI();
const stats = new Stats();
stats.begin();

canvas.width = innerWidth;
canvas.height = innerHeight;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});

renderer.setPixelRatio(Math.max(devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  1,
  1000,
);

const controls = new OrbitControls(camera, canvas);

// const material = new THREE.ShaderMaterial({
//   fragmentShader,
//   vertexShader,
//   uniforms:{
//     uTime:{value:0}
//   }
// })

const MainGroup = new THREE.Group();
scene.add(MainGroup);
MainGroup.add(camera);

const Manager = new THREE.LoadingManager(StartScene);
const TLoader = new THREE.TextureLoader(Manager);
const Draco = new DRACOLoader(Manager);
const GLB = new GLTFLoader(Manager);
const FBX = new FBXLoader(Manager);
const RGBE = new RGBELoader(Manager);
const PMGen = new THREE.PMREMGenerator(renderer);
PMGen.compileEquirectangularShader();

Draco.setDecoderPath("/draco/");
Draco.setDecoderConfig({ type: "wasm" });
GLB.setDRACOLoader(Draco);

scene.background = new THREE.Color(0x071a1f);
scene.fog = new THREE.FogExp2(0x071a1f, 0.06);

let carBody,
  carGlass,
  carContainer = new Group();
scene.add(carContainer);

const hdri1 = RGBE.load("/hdris/hdri1.hdr", (hdri) => {
  hdri.mapping = THREE.EquirectangularReflectionMapping;
});
const hdri2 = RGBE.load("/hdris/hdri2.hdr", (hdri) => {
  hdri.mapping = THREE.EquirectangularReflectionMapping;
});

scene.environment = hdri1;

let carMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 1,
  roughness: 0.2,
  envMap: hdri1,
  envMapIntensity: 1,
});

let glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x071a1f,
  metalness: 0.5,
  emissive: 0x071a1f,
  envMapIntensity: 0,
});

const floorMat = new THREE.MeshPhysicalMaterial({
  color: 0x161616,
  roughness: 0.88,
  metalness: 0.67,
  envMapIntensity: 0,
});

// const floor = new THREE.Mesh(
//   new THREE.PlaneGeometry(100,100,5,5),
//   floorMat
// )
// floor.rotation.x = (-Math.PI / 2)
// MainGroup.add(floor)

carContainer.targetRotation = { x: 0, y: 0, z: 0 };

((carContainer.targetRotation.x = -0.5),
  (carContainer.targetRotation.y = -0.56));
carContainer.targetRotation.z = -0.34;
lil.add(floorMat, "metalness").min(0).max(1);
lil.add(floorMat, "roughness").min(0).max(1);
lil.add(floorMat, "envMapIntensity").min(0).max(3);
lil.add(carContainer.targetRotation, "x", -Math.PI, Math.PI);
lil.add(carContainer.targetRotation, "y", -Math.PI, Math.PI);
lil.add(carContainer.targetRotation, "z", -Math.PI, Math.PI);

GLB.load("/car_body.glb", (glb) => {
  carBody = glb.scene;
  carContainer.add(carBody);
  carBody.scale.setScalar(0.01);
  carBody.traverse((node) => {
    if (node?.isMesh) {
      console.log(node.name);
      node.material = carMaterial;
    }
  });
});

GLB.load("/car_glass.glb", (glb) => {
  carGlass = glb.scene;
  carContainer.add(carGlass);
  carGlass.scale.setScalar(0.01);
  carGlass.traverse((node) => {
    if (node?.isMesh) {
      node.material = glassMaterial;
    }
  });
});

// Background Blob

lil.close();

const colors = [
  "#1A0A2E", // 0
  "#0D0B1E", // 1
  "#0F0A1A", // 2
  "#1C0D0A", // 3
  "#FF6B35", // 4
  "#ce7656", // 5
  "#7B5CFF", // 6
  "#6350b8", // 7
  "#2D0A5E", // 8
  "#8B1A6B", // 9
];

// Good Combos -> [7,4]

const blobGeo = new SphereGeometry(10, 10, 10);
const blobMat = new ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    color1: { value: new Color(colors[7]) },
    color2: { value: new Color(colors[4]) },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float uTime;

    float random(float x) {
    return fract(sin(x * 127.1) * 43758.5453);
}

    void main() {
      vec2 uv = (vUv - vec2(.5));
      vec3 color = mix(color1,color2,abs(uv.y * .7 + random(uv.x + uTime * .1) * .3) * 1.5);
      // gl_FragColor = vec4(abs(uv.y),.0,.0,1.0);
      gl_FragColor = vec4(color * .9,1.0);
    }
  `,
});

const Blob = new Mesh(blobGeo, blobMat);

scene.add(Blob);

// Postprocessing

const Composer = new EffectComposer(renderer);
const Render = new RenderPass(scene, camera);
const Bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.4,
  0.65,
  0.1,
);
const Afterimg = new AfterimagePass(0.85);

lil.add(Bloom, "strength").min(0).max(2);
lil.add(Bloom, "radius").min(0).max(1);
lil.add(Bloom, "threshold").min(0).max(1);

Composer.addPass(Render);
Composer.addPass(Bloom);
Composer.addPass(Afterimg);

function StartScene() {
  const ambl = new AmbientLight(0xffffff, 10);
  scene.add(ambl);
  const spotl = new THREE.SpotLight(0xffffff, 3, 5, 0.6, 1, 0.2);
  spotl.position.set(0, 5, 0);
  scene.add(spotl);
  // Injecting Shader's

  // carBody.material.onBeforeCompile = (shader) => {
  //   const uniforms = new Object({uTime:new Uniform(0)})
  //   const fragInject = new Injection();
  //   fragInject.setInjectString(shader.fragmentShader);
  //   const vertexInject = new Injection();
  //   vertexInject.setInjectString(shader.vertexShader);

  //   fragInject.addToInjectedString(/* glsl */ `
  //     uniform float uTime;
  //     mat4 rotationMatrix(vec3 axis, float angle) {
  //     axis = normalize(axis);
  //     float s = sin(angle);
  //     float c = cos(angle);
  //     float oc = 1.0 - c;

  //     return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
  //                 oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
  //                 oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
  //                 0.0,                                0.0,                                0.0,                                1.0);
  //               }

  //     vec3 rotate(vec3 v, vec3 axis, float angle) {
  //       mat4 m = rotationMatrix(axis, angle);
  //       return (m * vec4(v, 1.0)).xyz;
  //       // return v;
  //     }
  //     `);
  //   fragInject.inject(
  //     `#include <envmap_physical_pars_fragment>`,
  //     /* glsl */ `
  //       #ifdef USE_ENVMAP

  //       vec3 getIBLIrradiance( const in vec3 normal ) {

  //         #ifdef ENVMAP_TYPE_CUBE_UV

  //           vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

  //           vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );

  //           return PI * envMapColor.rgb * envMapIntensity;

  //         #else

  //           return vec3( 0.0 );

  //         #endif

  //       }

  //       vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

  //         #ifdef ENVMAP_TYPE_CUBE_UV

  //           vec3 reflectVec = reflect( - viewDir, normal );

  //           // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
  //           reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

  //           reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

  //           reflectVec = rotate(reflectVec,vec3(1.0,0.0,0.0),uTime * .05);

  //           vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );

  //           return envMapColor.rgb * envMapIntensity;

  //         #else

  //           return vec3( 0.0 );

  //         #endif

  //       }

  //       #ifdef USE_ANISOTROPY

  //         vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {

  //           #ifdef ENVMAP_TYPE_CUBE_UV

  //             // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
  //             vec3 bentNormal = cross( bitangent, viewDir );
  //             bentNormal = normalize( cross( bentNormal, bitangent ) );
  //             bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

  //             return getIBLRadiance( viewDir, bentNormal, roughness );

  //           #else

  //             return vec3( 0.0 );

  //           #endif

  //         }

  //       #endif

  //     #endif
  //     `
  //   );
  //   shader.fragmentShader = fragInject.getInjectedString();

  //   fragInject.InjectObject(shader.uniforms, uniforms);

  //   car.material.userData.shader = shader;
  // }

  camera.position.set(4, 2, 0);
  camera.lookAt(0, 0, 0);

  resize();
}

resize();
const clock = new THREE.Clock();
let Elapsed = clock.getElapsedTime();

const CONFIG = {
  floatAmplitude: 0.15, // how high/low it moves (in units)
  floatSpeed: 1.2, // cycles per second
};

lil.add(CONFIG, "floatAmplitude", 0, 0.5);
lil.add(CONFIG, "floatSpeed", 0, 2);

function Animate() {
  stats.begin();
  const NewElapsed = clock.getElapsedTime();
  const DT = NewElapsed - Elapsed;
  Elapsed = NewElapsed;
  controls.update();

  blobMat.uniforms.uTime.value = Elapsed;

  if (carContainer) {
    carContainer.rotation.x = carContainer.targetRotation.x;
    carContainer.rotation.y = carContainer.targetRotation.y;
    carContainer.rotation.z = carContainer.targetRotation.z;
    carContainer.position.y =
      Math.sin(Elapsed * CONFIG.floatSpeed * Math.PI * 2 * 0.1) *
      CONFIG.floatAmplitude;
  }

  // Composer.render(scene, camera);
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(Animate);
}

requestAnimationFrame(Animate);

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  renderer.setSize(innerWidth, innerHeight);
  Composer.setSize(innerWidth, innerHeight);
}

window.addEventListener("resize", resize);
