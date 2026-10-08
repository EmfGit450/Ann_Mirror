import { gsap } from "gsap";


import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Scene } from "@babylonjs/core/scene";

import { Camera } from "./camera";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";


import { Network, ActivationType, ConnectionType, LayerData } from "./structure";
import { UI } from "./ui/main";


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
  PerformanceDebug.children[2]!.textContent = `∆ ${frameDelta?.toFixed(2)} ms`;
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
  

  const settingsConfig = {
    rootSelector: ".settings-menu-panel",
    togglerSelector: "#app-settings",
    
    settingsSelectors: {
      themeToggle: "#theme-toggle"
    }
  };

  const builderConfig = {
    rootSelector: ".builder-panel",
    togglerSelector: "#builder-panel-toggler",

    networkRoot: net.networkRoot,
    
    actionButtonSelectors: {
      addLayerSelector: "#create-layer"
    },

    createLayerMenuConfig: {
      activation: {
        rootSelector: ".activation-config"
      },
      shape: {
        rootSelector: ".shape-number-inputs"
      }
    },
    
    settings: {
      forwardDirButtonSelectors: {
        px: "#px-dir", nx: "#nx-dir",
        py: "#py-dir", ny: "#ny-dir",
        pz: "#pz-dir", nz: "#nz-dir"
      }
    }
  };

  const ui = new UI(settingsConfig, builderConfig);
  
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

  await showGraphicsInfo();

  setTimeout(showDebugger, 1000);

  //@ts-ignore
  window.net = () => net;
  //@ts-ignore
  window.ui = () => ui;
  //Debugger End

  window.addEventListener("resize", () => {
    engine?.resize();
  });

  window.addEventListener("dblclick", () => { document.documentElement.requestFullscreen(); });

  window.addEventListener("contextmenu", (e) => e.preventDefault());
}

Main().catch((err) => console.log("Ann - Caught runtime error", err));