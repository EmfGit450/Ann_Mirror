import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import "@babylonjs/core/Meshes/instancedMesh";

import { Network, NeuronData, LayerData } from "./structure";
import { Camera } from "./camera";

const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

scene.clearColor = new Color4(0.01, 0.01, 0.01, 1);

if (!engine.isWebGPU) console.warn("This website requires WebGPU for functionality");

new HemisphericLight("light", new Vector3(0, 80, 0), scene);

//Tests Start
const net = new Network(scene);

let neuronId = 1n;
let synapseId = 1000n;

// Track IDs per layer to create fully-connected synapses
const layer0: number[] = [];
const layer1: number[] = [];
const layer2: number[] = [];
const layer3: number[] = [];

// ===================================================
// Layer 0
// ===================================================
const l0Size = 16;
const l0Spacing = 2.5;
const l0Offset = ((l0Size - 1) * l0Spacing) / 2;

for (let r = 0; r < l0Size; r++) {
  for (let c = 0; c < l0Size; c++) {
    const id = neuronId++;
    layer0.push(id);
    net.newNeuron({
      id,
      pos: new Float32Array([
        0,
        r * l0Spacing - l0Offset,
        c * l0Spacing - l0Offset
      ])
    });
  }
}

// ===================================================
// Layer 1
// ===================================================
const l1Size = 10;
const l1Spacing = 2.5;
const l1Offset = ((l1Size - 1) * l1Spacing) / 2;

for (let r = 0; r < l1Size; r++) {
  for (let c = 0; c < l1Size; c++) {
    const id = neuronId++;
    layer1.push(id);
    net.newNeuron({
      id,
      pos: new Float32Array([
        25,
        r * l1Spacing - l1Offset,
        c * l1Spacing - l1Offset
      ])
    });
  }
}

// ===================================================
// Layer 2
// ===================================================
const l2Size = 8;
const l2Spacing = 2.5;
const l2Offset = ((l2Size - 1) * l2Spacing) / 2;

for (let r = 0; r < l2Size; r++) {
  for (let c = 0; c < l2Size; c++) {
    const id = neuronId++;
    layer2.push(id);
    net.newNeuron({
      id,
      pos: new Float32Array([
        50,
        r * l2Spacing - l2Offset,
        c * l2Spacing - l2Offset
      ])
    });
  }
}

// ===================================================
// Layer 3: Vertical Stack
// ===================================================
const l3Count = 10;
const l3Spacing = 2.5;
const l3Offset = ((l3Count - 1) * l3Spacing) / 2;

for (let i = 0; i < l3Count; i++) {
  const id = neuronId++;
  layer3.push(id);
  net.newNeuron({
    id,
    pos: new Float32Array([
      75,
      i * l3Spacing - l3Offset,
      0
    ])
  });
}

// ===================================================
// Generate Fully Connected Synapses
// ===================================================
let synapses: SynapseData[] = [];

function connectLayers(fromLayer: number[], toLayer: number[]) {
  for (const start of fromLayer) {
    for (const end of toLayer) {
      synapses.push({ id: synapseId++, start, end });
    }
  }
}

connectLayers(layer0, layer1);
net.newSynapses(synapses);
synapses = [];
connectLayers(layer1, layer2);
net.newSynapses(synapses);
synapses = [];
connectLayers(layer2, layer3);
net.newSynapses(synapses);

net.newSynapses(synapses);
//Tests End

new Camera({scene: scene, canvas: canvas});

window.net = () => {
  return `memory: ${[...net.memory.values()]}`
}

scene.registerBeforeRender(() => {
    console.log("FPS:", Math.round(engine.getFps()));
});
engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});