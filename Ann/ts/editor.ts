import { gsap } from "gsap";


import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Scene } from "@babylonjs/core/scene";

import { Camera } from "./camera";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";


import { Network, ActivationType, ConnectionType, LayerData } from "./structure";
import { UI } from "./ui/main";
import { DebuggerUI } from "./ui/debugger";

import { FloatingWindowUI } from "./ui/floating-window";


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
//Init End

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
    shape: [1, 8, 8],
  };

  //@ts-ignore
  const layer1: LayerData = {
    pos: [21, 0, 0],
    shape: [1, 4, 4],
    activation: ActivationType.Softplus,
  };

  //@ts-ignore
  const layer2: LayerData = {
    pos: [31.5, 0, 0],
    shape: [1, 5, 5],
    activation: ActivationType.Softplus,
  };

  //@ts-ignore
  const layer3: LayerData = {
    pos: [38.5, 0, 0],
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

    network: net,

    actionButtonSelectors: {
      addLayerSelector: "#create-layer"
    },

    createLayerMenuConfig: {
      activation: {
        rootSelector: "#tb"//".activation-config"
      },
      shape: {
        rootSelector: "#ta"//".shape-number-inputs"
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

  

  new DebuggerUI({ rootSelector: ".debugger", bjsEngine: engine });
  

  const activationConfig = document.createElement("div");
activationConfig.classList.add("activation-config");

const activationLabel = document.createElement("label");
activationLabel.classList.add("sub");
activationLabel.textContent = "Activation";

activationConfig.append(activationLabel);

  const shapeConfig = document.createElement("div");
shapeConfig.classList.add("shape-config");

const shapeLabel = document.createElement("label");
shapeLabel.classList.add("sub");
shapeLabel.textContent = "Shape";

const shapeNumberInputs = document.createElement("div");
shapeNumberInputs.classList.add("shape-number-inputs");

shapeConfig.append(shapeLabel, shapeNumberInputs);

  const fw = new FloatingWindowUI({
    rootSelector: ".main-c",
    children: [activationConfig, shapeConfig],
    attrs: undefined,
    styleString: undefined,
    
    startPos: { x: 300, y: 300}
  });
  
  const ui = new UI(settingsConfig, builderConfig);
  //Tests End

  engine.runRenderLoop(() => {
    scene.render();
  });

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