import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/instancedMesh";

import { Network, NeuronData, LayerData } from "./structure";
import { AnnCamera } from "./camera";

const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

scene.clearColor = new Color4(0.01, 0.01, 0.01, 1);

if (!engine.isWebGPU) console.warn("This website requires WebGPU for functionality");

new HemisphericLight("light", new Vector3(0, 80, 0), scene);
//Small Bucket: 6x6 world
//Medium Bucket : 24x24 world
//Large Bucket : 54x54 world
//Mega Bucket : 72x72 world
/*const plane = MeshBuilder.CreatePlane("bucket", {width: 6, height: 6}, scene); 
const material = new StandardMaterial("glowblue", scene);
material.diffuseColor = new Color3(0.2, 0.6, 1.0);
material.emissiveColor = new Color3(0.1, 0.3, 0.5);
plane.material = material;*/

//Tests Start
const net = new Network(scene);

let id = 1;

for (let x = -42; x < 42; x+=3) {
  for (let y = -42; y < 42; y+=3) {
    net.newNeuron({id: id++, x: 0, y: y, z: x});
  }
}

for (let x = -21; x < 21; x+=3) {
  for (let y = -21; y < 21; y+=3) {
    net.newNeuron({id: id++, x: 30, y: y, z: x});
  }
}

import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";

const allPoints: Vector3[] = [];
const white = new Color4(1, 1, 1, 0.15);
const allColors: Color4[] = [];

for (let fromId = 1; fromId <= 784; fromId++) {
  const fromPos = net.memory.get(fromId)?.position;
  if (!fromPos) continue;
  
  for (let toId = 785; toId <= 980; toId++) {
    const toPos = net.memory.get(toId)?.position;
    if (!toPos) continue;
    
    allPoints.push(fromPos, toPos);
    allColors.push(white, white);
  }
}

console.log(`Creating ${allPoints.length / 2} synapses`);
CreateLines("all_synapses", {
  points: allPoints,
  colors: allColors
}, scene);
//Tests End

const editorCamera = new AnnCamera({scene: scene, canvas: canvas, twodim: false});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});