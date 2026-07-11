import {
  Engine, Scene,
  Vector3, Color3, Color4,
  ArcRotateCamera,
  HemisphericLight,
  StandardMaterial,
  CreateSphere
} from "@babylonjs/core";

import { NeuronRender } from "./structure";
import { AnnCamera } from "./camera";

const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

scene.clearColor = new Color4(0.01, 0.01, 0.01, 1);

if (!engine.isWebGPU) alert("This website requires WebGPU for functionality");

new HemisphericLight("light", new Vector3(0, 40, 0), scene);

const sphere = new NeuronRender({x: 0, y: 0}, scene);
const ball = new NeuronRender({x: 4, y: 0}, scene);

const editorCamera = new AnnCamera({scene: scene, canvas: canvas});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});