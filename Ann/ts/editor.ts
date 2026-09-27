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


import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import { RotationGizmo } from "@babylonjs/core/Gizmos/rotationGizmo";
import "@babylonjs/core/Culling/ray";


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
  
  gsap.fromTo("#debugger", {
    scale: 0
  }, {
    scale: 1,
    duration: 0.3,
    ease: "power4.inOut"
  });
}

function hideDebugger() {
  if (debugUpdateIntervalId !== undefined) {
    clearInterval(debugUpdateIntervalId);
    debugUpdateIntervalId = undefined;
  }
  
  gsap.fromTo("#debugger", {
    scale: 1
  }, {
    scale: 0,
    duration: 0.3,
    ease: "power4.inOut"
  });
}
//Debugger End

async function Main() {
  const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
  engine = await createEngine(canvas);
  const scene = new Scene(engine);
  
  scene.clearColor = new Color4(0.01, 0.01, 0.01, 1);
  
  new HemisphericLight("light", new Vector3(0, 80, 0), scene);
  
  new Camera({scene: scene, canvas: canvas});

  //Tests Start (AI assistance used for quick testing)
  const net = new Network(scene);
  
  //@ts-ignore
  const layer0: LayerData = {
    pos: [0, 0, 0],
    shape: [1, 14, 14]
  };
  
  //@ts-ignore
  const layer1: LayerData = {
    pos: [20, 0, 0],
    shape: [1, 4, 4],
    activation: ActivationType.Softplus
  };
  
  //@ts-ignore
  const layer2: LayerData = {
    pos: [30, 0, 0],
    shape: [1, 5, 5],
    activation: ActivationType.Softplus
  };
  
  //@ts-ignore
  const layer3: LayerData = {
    pos: [40, 0, 0],
    shape: [1, 10, 1],
    activation: ActivationType.Softplus
  };

  // net.newLayer(layer0);
  // net.newLayer(layer1);
  // net.newLayer(layer2);
  // net.newLayer(layer3);
  
  // //@ts-ignore
  // net.newConnection({
  //    type: ConnectionType.Dense,
  //    input: layer0,
  //    output: layer1
  // });

  // //@ts-ignore
  // net.newConnection({
  //   type: ConnectionType.Dense,
  //   input: layer1,
  //   output: layer2
  // });

  // //@ts-ignore
  // net.newConnection({
  //   type: ConnectionType.Dense,
  //   input: layer2,
  //   output: layer3
  // });

  // //@ts-ignore
  //  net.newConnection({
  //   type: ConnectionType.ResidualTransform,
  //   input: layer0,
  //   output: layer3
  // });

  console.log(net.parseNetworkAsArray(), net);

  const utilLayer = new UtilityLayerRenderer(scene, false, false, false, true);
utilLayer.utilityLayerScene.attachControl();

// Utility scene's input manager just stole primary input.
// Re-attach the main camera so it also receives pointer events.
const mainCamera = scene.activeCamera;
mainCamera?.detachControl();
mainCamera?.attachControl(canvas, true);

const rotationGizmo = new RotationGizmo(utilLayer);
rotationGizmo.scaleRatio = 1.3;

const forwardPivot = new TransformNode("forwardPivot", scene);
if (!forwardPivot.rotationQuaternion) {
  forwardPivot.rotationQuaternion = Quaternion.FromEulerAngles(
    forwardPivot.rotation.x, forwardPivot.rotation.y, forwardPivot.rotation.z
  );
}

const tube = CreateCapsule("forwardDirShaft", { height: 2, radius: 0.1 }, scene);
tube.parent = forwardPivot;
tube.position.y = 1;

const cone = CreateCylinder("forwardDirArrow", {
  height: 0.4, diameterTop: 0, diameterBottom: 0.4
}, scene);
cone.parent = forwardPivot;
cone.position.y = 2.1;

rotationGizmo.attachedMesh = forwardPivot;
// Hide the Y-axis rotation ring (the yellow one in your screenshot)
rotationGizmo.yGizmo.isEnabled = false;

  for (const sub of [rotationGizmo.xGizmo, rotationGizmo.yGizmo, rotationGizmo.zGizmo]) {
  // Option A: kill the shader material's output
 // sub._rotationShaderMaterial.alpha = 0;

  // Option B: keep visibility at 0 even after drag start
  sub.dragBehavior.onDragStartObservable.add(() => {
    sub._rotationDisplayPlane.visibility = 0;
  });
  sub.dragBehavior.onDragObservable.add(() => {
    sub._rotationDisplayPlane.visibility = 0;
  });

    
  sub.coloredMaterial.diffuseColor = new Color4(0.8, 0.7, 1.0, 1);
  sub.hoverMaterial.diffuseColor = new Color4(0.4, 0.8, 1.0, 1);
  }
  
let activeTween: gsap.core.Tween | null = null;
const SNAP = Math.PI / 2;

function snapForwardPivot() {
  const node = forwardPivot;
  const current = node.rotationQuaternion!.clone();

  const euler = current.toEulerAngles();
  const target = Quaternion.FromEulerAngles(
    Math.round(euler.x / SNAP) * SNAP,
    Math.round(euler.y / SNAP) * SNAP,
    Math.round(euler.z / SNAP) * SNAP
  );

  const proxy = { t: 0 };
  const start = current.clone();

  activeTween = gsap.to(proxy, {
    t: 1,
    duration: 0.25,
    ease: "power2.out",
    onUpdate: () => {
      Quaternion.SlerpToRef(start, target, proxy.t, node.rotationQuaternion!);
    }
  });
}

for (const sub of [rotationGizmo.xGizmo, rotationGizmo.yGizmo, rotationGizmo.zGizmo]) {
  sub.dragBehavior.onDragStartObservable.add(() => {
    activeTween?.kill();
    activeTween = null;
  });
  sub.dragBehavior.onDragEndObservable.add(snapForwardPivot);
}





  new BuilderMenu({ 
    root: ".builder-panel",
    showButton: "#builder-button",
    collapseButton: "#collapse-builder-panel"
  });
  //Tests End

  engine.runRenderLoop(() => {
    scene.render(); 
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

  await showGraphicsInfo()
  
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
}
catch (err) {
  console.log("Ann - Caught runtime error", err);
}