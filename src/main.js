import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { Injection } from "./utils/injection.js";
import fragmentShader from "./shaders/fragment.glsl";
import vertexShader from "./shaders/vertex.glsl";
import { Uniform } from "three";

const { PI } = Math;

const canvas = document.querySelector("canvas");

canvas.width = innerWidth;
canvas.height = innerHeight;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  1,
  1000
);
camera.position.z = 5;

// const material = new THREE.ShaderMaterial({
//   fragmentShader,
//   vertexShader,
//   uniforms:{
//     uTime:{value:0}
//   }
// })

const Manager = new THREE.LoadingManager(StartScene);
const TLoader = new THREE.TextureLoader(Manager);
const Draco = new DRACOLoader(Manager);
const GLB = new GLTFLoader(Manager);
const PMGen = new THREE.PMREMGenerator(renderer);
PMGen.compileEquirectangularShader();

Draco.setDecoderPath("/draco/");
Draco.setDecoderConfig({ type: "wasm" });
GLB.setDRACOLoader(Draco);

scene.background = new THREE.Color(0x071a1f); // deep dark teal

// const blueLight = new THREE.RectAreaLight(0x3dffff, 32, 5, 3);
// blueLight.position.set(-2.2, 1.6, 1.5); // left, above, front-side
// blueLight.lookAt(0, 0.8, 0);

// const pinkLight = new THREE.RectAreaLight(0xff2ea6, 40, 6, 4);
// pinkLight.position.set(2.8, 1.0, -1.2); // right, lower, back-side
// pinkLight.lookAt(0, 0.7, 0);

// scene.add(blueLight, pinkLight);

let Env1, Env2;

TLoader.load("/env.jpg", (env) => {
  Env1 = PMGen.fromEquirectangular(env).texture;
});
TLoader.load("/env1.jpg", (env) => {
  Env2 = PMGen.fromEquirectangular(env).texture;
});

let Cube;

function StartScene() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.23,
    envMap: Env1,
    envMapIntensity: 3,
  });
  Cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);

  // Injecting Shader's

  Cube.material.onBeforeCompile = (shader) => {
    const uniforms = new Object({uTime:new Uniform(0)})
    const fragInject = new Injection();
    fragInject.setInjectString(shader.fragmentShader);
    const vertexInject = new Injection();
    vertexInject.setInjectString(shader.vertexShader);

    fragInject.addToInjectedString(/* glsl */ `
      uniform float uTime;
      mat4 rotationMatrix(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
                }

      vec3 rotate(vec3 v, vec3 axis, float angle) {
        mat4 m = rotationMatrix(axis, angle);
        return (m * vec4(v, 1.0)).xyz;
        // return v;
      }
      `);
    fragInject.inject(
      `#include <envmap_physical_pars_fragment>`,
      /* glsl */ `
        #ifdef USE_ENVMAP

        vec3 getIBLIrradiance( const in vec3 normal ) {

          #ifdef ENVMAP_TYPE_CUBE_UV

            vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

            vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );

            return PI * envMapColor.rgb * envMapIntensity;

          #else

            return vec3( 0.0 );

          #endif

        }

        vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

          #ifdef ENVMAP_TYPE_CUBE_UV

            vec3 reflectVec = reflect( - viewDir, normal );
            
            // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
            reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
            
            reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
            
            reflectVec = rotate(reflectVec,vec3(1.0,0.0,0.0),uTime * .05);

            vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );

            return envMapColor.rgb * envMapIntensity;

          #else

            return vec3( 0.0 );

          #endif

        }

        #ifdef USE_ANISOTROPY

          vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {

            #ifdef ENVMAP_TYPE_CUBE_UV

              // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
              vec3 bentNormal = cross( bitangent, viewDir );
              bentNormal = normalize( cross( bentNormal, bitangent ) );
              bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

              return getIBLRadiance( viewDir, bentNormal, roughness );

            #else

              return vec3( 0.0 );

            #endif

          }

        #endif

      #endif
      `
    );
    shader.fragmentShader = fragInject.getInjectedString();

    fragInject.InjectObject(shader.uniforms, uniforms);

    console.log(Cube.material.userData)

    Cube.material.userData.shader = shader;
  }

  Cube.rotation.set(-PI / 4, PI / 4, PI / 2);

  scene.add(Cube);
  console.log(Env1, Env2);
}

const clock = new THREE.Clock()
let Elapsed = clock.getElapsedTime()

function Animate() {
  const NewElapsed = clock.getElapsedTime();
  const DT = NewElapsed - Elapsed
  Elapsed = NewElapsed;
  if (Cube) {
    if(Cube.material.userData.shader) {
      Cube.material.userData.shader.uniforms.uTime.value += DT * 10;
    }
    // Cube.rotation.z += 0.01
  };
  renderer.render(scene, camera);
  requestAnimationFrame(Animate);
}

requestAnimationFrame(Animate);

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  renderer.setSize(innerWidth, innerHeight);
}

window.addEventListener("resize", resize);
