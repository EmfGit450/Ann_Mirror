console.log("started red");

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import { Network, NeuronData, LayerData } from "./structure";
import { AnnCamera } from "./camera";

const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

scene.clearColor = new Color4(1,0,0,1)//(0.01, 0.01, 0.01, 1);

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
const test: NeuronData = {
  id: 31672903,
  type: 1,
  layerOx: 0,
  neuronOy: 0
}

const net = new Network(scene);
net.newNeuron(test);
net.newNeuron({id: 3637, type: 1, layerOx: 3.5, neuronOy: 2.2});
net.newNeuron({id: 3637, type: 1, layerOx: 3.5, neuronOy: -2.2});

/*
// 1. Create a lightweight material for the synapse wire
const synapseMaterial = new StandardMaterial("synapseMat", scene);
synapseMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);   // Sleek slate grey
synapseMaterial.emissiveColor = new Color3(0.4, 0.4, 0.4);  // Low shine to keep it schematic

// 2. Define the path vectors between Neuron 1 (0, 0, 0) and Neuron 2 (0, 2.2, 0)
const synapsePath = [
  new Vector3(0, 0, 0),
  new Vector3(3.5, 2.2, 0)
];

// 3. Build the 3D synapse tube
const synapse = MeshBuilder.CreateTube("synapse_31672903_3637", {
  path: synapsePath,
  radius: 0.07,           // Thin wire profile relative to your spheres
  tessellation: 6,        // 6 sides (hexagonal pipe) looks geometric and saves mobile GPU performance
  cap: Mesh.CAP_ALL       // Seals both ends cleanly inside the neuron spheres
}, scene);

synapse.material = synapseMaterial;*/
//Tests End

const editorCamera = new AnnCamera({scene: scene, canvas: canvas, twodim: false});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});