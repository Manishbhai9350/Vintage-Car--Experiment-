import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { Injection } from "./utils/injection.js";
import fragmentShader from "./shaders/fragment.glsl";
import vertexShader from "./shaders/vertex.glsl";
import { OrbitControls, RGBELoader, SepiaShader, VignetteShader } from "three/examples/jsm/Addons.js";
import {GUI} from 'lil-gui'
import { AmbientLight } from "three";
import {  EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import {  RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import {  UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import {  AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js'
import Stats from "three/examples/jsm/libs/stats.module.js";

const { PI } = Math;

const canvas = document.querySelector("canvas");

const lil = new GUI()
const stats = new Stats()
stats.begin()



canvas.width = innerWidth;
canvas.height = innerHeight;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});

renderer.setPixelRatio(Math.max(devicePixelRatio,2))

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  1,
  1000
);

const controls = new OrbitControls(camera,canvas)

// const material = new THREE.ShaderMaterial({
//   fragmentShader,
//   vertexShader,
//   uniforms:{
//     uTime:{value:0}
//   }
// })

const MainGroup = new THREE.Group()
scene.add(MainGroup)
MainGroup.add(camera)

const Manager = new THREE.LoadingManager(StartScene);
const TLoader = new THREE.TextureLoader(Manager);
const Draco = new DRACOLoader(Manager);
const GLB = new GLTFLoader(Manager);
const FBX = new FBXLoader(Manager)
const RGBE = new RGBELoader(Manager)
const PMGen = new THREE.PMREMGenerator(renderer);
PMGen.compileEquirectangularShader();

Draco.setDecoderPath("/draco/");
Draco.setDecoderConfig({ type: "wasm" });
GLB.setDRACOLoader(Draco);

scene.background = new THREE.Color(0x071a1f);
scene.fog = new THREE.FogExp2(0x071a1f,.06)

let carBody;


const hdri1 = RGBE.load('/hdris/hdri1.hdr',hdri => {
  hdri.mapping = THREE.EquirectangularReflectionMapping
})
const hdri2 = RGBE.load('/hdris/hdri2.hdr',hdri => {
  hdri.mapping = THREE.EquirectangularReflectionMapping
})

scene.environment = hdri1

let carMaterial = new THREE.MeshPhysicalMaterial({
  color:0xffffff,
  metalness:1,
  roughness:.2,
  envMap:hdri1,
  envMapIntensity:1
})

let glassMaterial = new THREE.MeshPhysicalMaterial({
  color:0x071a1f,
  metalness:.5,
  emissive:0x071a1f,
  envMapIntensity:0
})


const floorMat = new THREE.MeshPhysicalMaterial({
    color:0x161616,
    roughness:.88,
    metalness:.67,
    envMapIntensity:0
  })

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100,100,5,5),
  floorMat
)
floor.rotation.x = (-Math.PI / 2)
MainGroup.add(floor)


lil.add(floorMat,'metalness').min(0).max(1)
lil.add(floorMat,'roughness').min(0).max(1)
lil.add(floorMat,'envMapIntensity').min(0).max(3)


GLB.load('/car_body.glb',glb => {
  carBody = glb.scene
  MainGroup.add(carBody)
  carBody.scale.setScalar(.01)
  carBody.traverse(node => {
    if(node?.isMesh) {
      console.log(node.name)
      node.material = carMaterial
    }
  })
})

GLB.load('/car_glass.glb',glb => {
  carBody = glb.scene
  MainGroup.add(carBody)
  carBody.scale.setScalar(.01)
  carBody.traverse(node => {
    if(node?.isMesh) {
      console.log(node.name)
      node.material = glassMaterial
    }
  })
})


// Postprocessing 

const Composer = new EffectComposer(renderer)
const Render = new RenderPass(scene,camera)
const Bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth,innerHeight)
  ,.5,.65,.1)
const Afterimg = new AfterimagePass(.85)

lil.add(Bloom,'strength').min(0).max(2)
lil.add(Bloom,'radius').min(0).max(1)
lil.add(Bloom,'threshold').min(0).max(1)


Composer.addPass(Render)
Composer.addPass(Bloom)
Composer.addPass(Afterimg)

function StartScene() {
  const ambl = new AmbientLight(0xffffff,10)
  scene.add(ambl)
  const spotl = new THREE.SpotLight(0xffffff,3,5,.6,1,.2)
  spotl.position.set(0,5,0)
  scene.add(spotl)
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


  // carBody.rotation.set(0.47,0.25, .151);
  camera.position.set(4,2,0)
  camera.lookAt(0,0,0)
  
  resize()

}

const clock = new THREE.Clock()
let Elapsed = clock.getElapsedTime()

function Animate() {
  stats.begin()
  const NewElapsed = clock.getElapsedTime();
  const DT = NewElapsed - Elapsed
  Elapsed = NewElapsed;
  controls.update()
  // stats.update()
  if (carBody) {
    if(carBody.material?.userData?.shader) {
      // carBody.material.userData.shader.uniforms.uTime.value += DT * 10;
    }
    // Cube.rotation.z += 0.01
  };
  Composer.render(scene, camera);
  // renderer.render(scene,camera)
  stats.end()
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
