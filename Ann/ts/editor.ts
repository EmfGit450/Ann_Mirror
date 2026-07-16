import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/instancedMesh";
import "@babylonjs/core/Materials/GreasedLine/greasedLinePluginMaterial";

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
const test: NeuronData = {
  id: 31672903,
  type: 1,
  layerOx: 0,
  neuronOy: 0
}

const net = new Network(scene);

const layerSizes = [1,20, 16, 16, 10]; // matches your image
const SPACING_X = 5.5;
const SPACING_Y = 3;
const layerMap = new Map<number, number[]>();
let synapseId = 0;

// 1. Create neurons per layer, centered
for (let layer = 0; layer < layerSizes.length; layer++) {
  const neuronsInLayer = layerSizes[layer];
  layerMap.set(layer, []);
  
  for (let r = 0; r < neuronsInLayer; r++) {
    const id = layer * 1000 + r; // unique: 0, 1000, 1001, 2000...
    const yOffset = (r - (neuronsInLayer - 1) / 2) * SPACING_Y; // center vertically
    
    net.newNeuron({
      id: id, 
      type: 1, 
      layerOx: (layer + 1) * SPACING_X, 
      neuronOy: yOffset
    });
    layerMap.get(layer)!.push(id);
  }
}

// 2. Connect each layer to the next: full feedforward
for (let layer = 0; layer < layerSizes.length - 1; layer++) {
  const currentLayer = layerMap.get(layer)!;
  const nextLayer = layerMap.get(layer + 1)!;

  for (const startId of currentLayer) {
    for (const endId of nextLayer) {
      net.newSynapse({
        start: startId, 
        end: endId, 
        id: synapseId++
      });
    }
  }
}



//net.newSynapse({start: 0, end: , id: 3609});
// net.newSynapse({start: 31672903, end: 3638, id: 3609});
//Tests End

const editorCamera = new AnnCamera({scene: scene, canvas: canvas, twodim: false});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});