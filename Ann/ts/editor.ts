import { gsap } from "gsap";


import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Scene } from "@babylonjs/core/scene";

import { Camera } from "./camera";

import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";


import { Network, ActivationType, ConnectionType, LayerData } from "./structure";

import { BuilderMenu } from "./ui";


import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";


//Init Start
let engine: WebGPUEngine | Engine | null = null;

async function createEngine(canvas: HTMLCanvasElement) {
  if ("gpu" in navigator) {
    try {
      const webgpuEngine = new WebGPUEngine(canvas);

      await webgpuEngine.initAsync();

      console.log("Ann - Using WebGPU");
      return webgpuEngine;
    } catch (error) {
      console.warn("Ann - WebGPU initialization failed; falling back to WebGL", error);
    }
  }

  console.log("Ann - Using WebGL");
  return new Engine(canvas, true);
}

async function getWebGPUInfo() {
  //@ts-ignore
  if (!navigator.gpu) {
    return null;
  }

  //@ts-ignore
  const adapter = await navigator.gpu.requestAdapter();

  if (!adapter) {
    return null;
  }

  const info = adapter.info;

  return {
    vendor: info.vendor || "Unavailable",
    renderer: info.device || info.description || "Unavailable",
  };
}

async function showGraphicsInfo() {
  if (engine?.isWebGPU) {
    const info = await getWebGPUInfo();

    document.getElementById("debugger-vendor")!.textContent = info?.vendor ?? "Unavailable";
    document.getElementById("debugger-renderer")!.textContent = info?.renderer ?? "Unavailable";
    document.getElementById("debugger-api")!.textContent = "WebGPU";

    return;
  }

  const info = (engine as Engine).getGlInfo();

  document.getElementById("debugger-vendor")!.textContent = info.vendor;
  document.getElementById("debugger-renderer")!.textContent = info.renderer;
  document.getElementById("debugger-api")!.textContent = `WebGL ${(engine as Engine).webGLVersion}`;
}
//Init End

//Debugger Start
const Debugger = document.getElementById("debugger")!;

const PerformanceDebug = document.querySelector(".performance")!;

let debugUpdateIntervalId: number | undefined = undefined;
let frameDelta: number | null = null;

function updateDebugger() {
  PerformanceDebug.children[1]!.textContent = `${Math.round(engine?.getFps() as number)} fps`;
  PerformanceDebug.children[2]!.textContent = `∆ ${frameDelta?.toFixed(2)}ms`;
}

function showDebugger() {
  updateDebugger();

  if (debugUpdateIntervalId !== undefined) {
    clearInterval(debugUpdateIntervalId);
  }

  debugUpdateIntervalId = setInterval(updateDebugger, 150);

  gsap.fromTo(
    "#debugger",
    {
      scale: 0,
    },
    {
      scale: 1,
      duration: 0.3,
      ease: "power4.inOut",
    }
  );
}

function hideDebugger() {
  if (debugUpdateIntervalId !== undefined) {
    clearInterval(debugUpdateIntervalId);
    debugUpdateIntervalId = undefined;
  }

  gsap.fromTo(
    "#debugger",
    {
      scale: 1,
    },
    {
      scale: 0,
      duration: 0.3,
      ease: "power4.inOut",
    }
  );
}
//Debugger End

async function Main() {
  const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
  engine = await createEngine(canvas);
  const scene = new Scene(engine);

  scene.clearColor = new Color4(0.01, 0.01, 0.01, 1);

  new HemisphericLight("light", new Vector3(0, 80, 0), scene);

  new Camera({ scene: scene, canvas: canvas });

  //Tests Start (AI assistance used for quick testing)
  const net = new Network(scene);

  //@ts-ignore
  const layer0: LayerData = {
    pos: [0, 0, 0],
    shape: [1, 14, 14],
  };

  //@ts-ignore
  const layer1: LayerData = {
    pos: [20, 0, 0],
    shape: [1, 4, 4],
    activation: ActivationType.Softplus,
  };

  //@ts-ignore
  const layer2: LayerData = {
    pos: [30, 0, 0],
    shape: [1, 5, 5],
    activation: ActivationType.Softplus,
  };

  //@ts-ignore
  const layer3: LayerData = {
    pos: [40, 0, 0],
    shape: [1, 10, 1],
    activation: ActivationType.Softplus,
  };

  net.newLayer(layer0);
  net.newLayer(layer1);
  net.newLayer(layer2);
  net.newLayer(layer3);

  //@ts-ignore
  net.newConnection({
    type: ConnectionType.Dense,
    input: layer0,
    output: layer1,
  });

  //@ts-ignore
  net.newConnection({
    type: ConnectionType.Dense,
    input: layer1,
    output: layer2,
  });

  //@ts-ignore
  net.newConnection({
    type: ConnectionType.Dense,
    input: layer2,
    output: layer3,
  });

  //@ts-ignore
  net.newConnection({
    type: ConnectionType.ResidualTransform,
    input: layer0,
    output: layer3,
  });

  console.log(net.parseNetworkAsArray(), net);

  
  new BuilderMenu({
    root: ".builder-panel",
    showButton: "#builder-button",
    collapseButton: "#collapse-builder-panel",
  });


  const axes = new AxesViewer(scene, 4);
  const desiredScreenSize = 0.15;

  const setAxisColor = (axis: TransformNode, color: Color4) => {
    axis.getChildMeshes().forEach(mesh => {
        if (mesh.material) {
            const mat = mesh.material as StandardMaterial;
            mat.emissiveColor = color;
            mat.diffuseColor = color;
            mat.specularColor = new Color4(0, 0, 0, 0);
            mat.disableLighting = true;
        }
    });
};

setAxisColor(axes.xAxis, new Color4(1, 0.15, 0.15, 1)); // Red
setAxisColor(axes.yAxis, new Color4(0.15, 1, 0.15, 1)); // Green
setAxisColor(axes.zAxis, new Color4(0.2, 0.4, 1)), 1;   // Blue
  
  scene.onBeforeRenderObservable.add(() => {
    const camera = scene.activeCamera;
    if (!camera) return;

    // Distance from camera to the axes origin (or wherever you placed it)
    const distance = Vector3.Distance(camera.position, axes.xAxis.position);

    // Make the visual size constant on screen
    axes.scaleLines = desiredScreenSize * distance;
  });
  //Tests End

  let frameC = 0;
  engine.runRenderLoop(() => {
    frameC++;
    scene.render();

    if (frameC >= 120) {
      frameC = 0;

      gsap.to(net.networkRoot.rotation, {
        y: net.networkRoot.rotation.y + Math.PI / 2,
        duration: 0.5,
        ease: "power3.inOut"
      })
      //net.networkRoot.rotation.y + Math.PI / 2;
    }
  });

  let lastFrameTime = performance.now();

  scene.onBeforeRenderObservable.add(() => {
    const now = performance.now();
    frameDelta = now - lastFrameTime;
    lastFrameTime = now;
  });

  //Debugger Start
  Debugger.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.closest("#debugger-close-btn")) {
      hideDebugger();
    }
  });

  await showGraphicsInfo();

  setTimeout(showDebugger, 1000);

  //@ts-ignore
  window.net = () => net;
  //Debugger End

  window.addEventListener("resize", () => {
    engine?.resize();
  });
}

try {
  Main();
} catch (err) {
  console.log("Ann - Caught runtime error", err);
}
