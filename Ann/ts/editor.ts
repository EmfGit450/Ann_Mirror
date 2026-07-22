import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import "@babylonjs/core/Meshes/instancedMesh";

import { Network, NeuronData, LayerData } from "./structure";
import { AnnCamera } from "./camera";

const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

scene.clearColor = new Color4(0.01, 0.01, 0.01, 1);

if (!engine.isWebGPU) console.warn("This website requires WebGPU for functionality");

new HemisphericLight("light", new Vector3(0, 80, 0), scene);

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
const white = new Color4(1,1,1,0.02);

for (let fromId = 1; fromId <= 784; fromId++) {
  const fromPos = net.memory.get(fromId)?.position;
  if (!fromPos) continue;
  
  for (let c = 0; c < 2; c++) {
    const toId = 785 + Math.floor(Math.random() * 196);
    const toPos = net.memory.get(toId)?.position;
    if (!toPos) continue;
    
    CreateLines(`s_${fromId}_${c}`, {
      points: [fromPos, toPos],
      colors: [white, white]
    }, scene);
  }
}

//Tests End

new AnnCamera({scene: scene, canvas: canvas, twodim: false});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});