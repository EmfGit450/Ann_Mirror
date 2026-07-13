import {
  Engine, Scene,
  Vector3, Color3, Color4,
  ArcRotateCamera,
  HemisphericLight,
  StandardMaterial,
  MeshBuilder
} from "@babylonjs/core";

import { Network, NeuronData, LayerData } from "./structure";
import { AnnCamera } from "./camera";

const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

scene.clearColor = new Color4(0.01, 0.01, 0.01, 1);

if (!engine.isWebGPU) console.warn("This website requires WebGPU for functionality");

new HemisphericLight("light", new Vector3(0, 40, 0), scene);

//Small Bucket: 6x6 world
//Medium Bucket : 24x24 world
//Large Bucket : 54x54 world
//Mega Bucket : 72x72 world
const plane = MeshBuilder.CreatePlane("bucket", {width: 6, height: 6}, scene); 
const material = new StandardMaterial("glowblue", scene);
material.diffuseColor = new Color3(0.2, 0.6, 1.0);
material.emissiveColor = new Color3(0.1, 0.3, 0.5);
plane.material = material;

const test: NeuronData = {
  id: 31672903,
  type: 1,
  layerOx: 0,
  neuronOy: 0
}

const net = new Network(scene);
net.newNeuron(test);

const editorCamera = new AnnCamera({scene: scene, canvas: canvas});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});