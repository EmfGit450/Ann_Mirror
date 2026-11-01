import { gsap } from "gsap";

import { AxisDragGizmo } from "@babylonjs/core/Gizmos/axisDragGizmo";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import "@babylonjs/core/Culling/ray";

import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

import "@babylonjs/core/Rendering/edgesRenderer";

import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";

import { NumberInputUI } from "./number-input";
import { DropdownUI } from "./dropdown";
import { FloatingWindowUI } from "./floating-window";

import { Network } from "../structure";
import { Layer } from "@babylonjs/core";

interface SettingsConfig {
  rootSelector: string;
  togglerSelector: string;

  settingsSelectors: {
    themeToggle: string;
  };
}


interface BuilderConfig {
  rootSelector: string;
  togglerSelector: string;

  network: Network;

  actionButtonSelectors: {
    addLayerSelector: string;
  };

  createLayerMenuConfig: LayerCreationMenuConfig;

  settings: {
    forwardDirButtonSelectors: {
      px: string, nx: string,
      py: string, ny: string,
      pz: string, nz: string,
    };
  }
}

interface LayerCreationMenuConfig {
  activation: {
    rootSelector: string;
  }
  shape: {
    rootSelector: string;
  };
}


interface SettingsUI {
  root: HTMLElement;
  toggler: HTMLButtonElement;

  settings: {
    themeToggle: HTMLButtonElement;
  };
}


interface BuilderUI {
  root: HTMLElement;
  toggler: HTMLButtonElement;

  connectedNet: Network;

  actions: {
    addLayer: HTMLButtonElement;
  }

  createLayerWindows: LayerCreationMenu[];

  settings: {
    forwardDirButtons: {
      px: HTMLButtonElement, nx: HTMLButtonElement,
      py: HTMLButtonElement, ny: HTMLButtonElement,
      pz: HTMLButtonElement, nz: HTMLButtonElement,
    };
  }
}

type LayerCreationMenu = FloatingWindowUI;

interface LayerCreationMenuState {
  activation: string;
  shape: {
    forward: number;
    vertical: number;
    horizontal: number;
  };
}


interface UIState {
  settings: {
    panelToggled: boolean; //whether the settings menu is shown or not
    lightMode: boolean;
  }

  builder: {
    panelToggled: boolean;

    createLayerWindowStates: LayerCreationMenuState[]; //multiple can be open at once

    settings: {
      forwardDirection: ForwardDirection;
    };
  }
}


export const enum ForwardDirection {
  PositiveX, NegativeX,
  PositiveY, NegativeY,
  PositiveZ, NegativeZ,
}

const DIRECTION_YAW_PITCH = [
  { yaw: 0, pitch: 0 },
  { yaw: Math.PI, pitch: 0 },
  { yaw: 0, pitch: Math.PI / 2 },
  { yaw: 0, pitch: -Math.PI / 2 },
  { yaw: -Math.PI / 2, pitch: 0 },
  { yaw: Math.PI / 2, pitch: 0 },
]

export class UI {
  settingsUI: SettingsUI;
  builderUI: BuilderUI;

  state: UIState;

  forwardDirTweening: boolean = false;

  constructor(settingsConfig: SettingsConfig,
              builderConfig: BuilderConfig) {
    //Init Start
    this.state = {
      settings: {
        panelToggled: false,
        lightMode: false
      },
      builder: {
        panelToggled: false,

        createLayerWindowStates: [],

        settings: {
          forwardDirection: ForwardDirection.PositiveX
        }
      }
    }


    this.settingsUI = {
      root: document.querySelector(settingsConfig.rootSelector)!,
      toggler: document.querySelector(settingsConfig.togglerSelector)!,

      settings: {
        themeToggle: document.querySelector(settingsConfig.settingsSelectors.themeToggle)!
      }
    }


    this.builderUI = {
      root: document.querySelector(builderConfig.rootSelector)!,
      toggler: document.querySelector(builderConfig.togglerSelector)!,

      connectedNet: builderConfig.network,

      actions: {
        addLayer: document.querySelector(builderConfig.actionButtonSelectors.addLayerSelector)!
      },

      createLayerWindows: [],

      settings: {
        forwardDirButtons: {
          px: document.querySelector(builderConfig.settings.forwardDirButtonSelectors.px)!, nx: document.querySelector(builderConfig.settings.forwardDirButtonSelectors.nx)!,
          py: document.querySelector(builderConfig.settings.forwardDirButtonSelectors.py)!, ny: document.querySelector(builderConfig.settings.forwardDirButtonSelectors.ny)!,
          pz: document.querySelector(builderConfig.settings.forwardDirButtonSelectors.pz)!, nz: document.querySelector(builderConfig.settings.forwardDirButtonSelectors.nz)!
        }
      }
    }


    gsap.set(this.settingsUI.root, { xPercent: 100, opacity: 1 });
    gsap.set(this.builderUI.root, { xPercent: -100, opacity: 1 });

    this.builderUI.connectedNet.networkRoot.rotationQuaternion = Quaternion.Identity();
    //Init End

    //Main UI Togglers Start
    this.settingsUI.toggler.addEventListener("click", () => {
      this.state.settings.panelToggled = !this.state.settings.panelToggled;

      console.log(this.settingsUI.root.offsetWidth)

      gsap.to(this.settingsUI.root, {
        xPercent: this.state.settings.panelToggled ? 0 : 100,
        duration: 0.3,
        ease: "expo.inOut"
      });
      gsap.to(this.settingsUI.toggler.parentElement, {
        x: () => (this.state.settings.panelToggled ? -this.settingsUI.root.offsetWidth : 0),
        duration: 0.3,
        ease: "expo.inOut"
      });
    });

    window.addEventListener("resize", () => {
      gsap.set(this.settingsUI.toggler.parentElement, {
        x: this.state.settings.panelToggled ? -this.settingsUI.root.offsetWidth : 0
      });
    });

    this.builderUI.toggler.addEventListener("click", () => {
      this.state.builder.panelToggled = !this.state.builder.panelToggled;

      gsap.to(this.builderUI.root, {
        xPercent: this.state.builder.panelToggled ? 0 : -100,
        duration: 0.3,
        ease: "circ.inOut"
      });
      gsap.to(this.builderUI.toggler.parentElement, {
        x: () => (this.state.builder.panelToggled ? this.builderUI.root.offsetWidth : 0),
        duration: 0.3,
        ease: "circ.inOut"
      });
    });

    window.addEventListener("resize", () => {
      gsap.set(this.builderUI.toggler.parentElement, {
        x: this.state.builder.panelToggled ? this.builderUI.root.offsetWidth : 0
      });
    });
    //Main UI Togglers End

    //Builder Start

    //Forward Direction Start
    this.builderUI.settings.forwardDirButtons.px.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveX); });
    this.builderUI.settings.forwardDirButtons.py.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveY); });
    this.builderUI.settings.forwardDirButtons.pz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveZ); });
    this.builderUI.settings.forwardDirButtons.nx.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeX); });
    this.builderUI.settings.forwardDirButtons.ny.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeY); });
    this.builderUI.settings.forwardDirButtons.nz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeZ); });
    //Forward Direction End


    //Activation Start
    this.builderUI.createLayer.activation.setCallback(() => {
      this.state.builder.createLayerMenu.activation = this.builderUI.createLayer.activation.getValue();
    });
    //Activation End

    //Layer Preview Start
    const utilLayer = new UtilityLayerRenderer(this.builderUI.connectedNet.scene);
    const gizmo = new AxisDragGizmo(new Vector3(1, 0, 0), new Color3(0.4, 0.4, 1), utilLayer);

    const GRID = 3.5;

    let activeSnapTween: gsap.core.Tween | null = null;

    gizmo.dragBehavior.onDragStartObservable.add(() => {
      activeSnapTween?.kill();
      activeSnapTween = null;
    });

    gizmo.dragBehavior.onDragEndObservable.add(() => {
      const currPos = gizmo.attachedMesh!.position;
      const targetPos = new Vector3(
        Math.round(currPos.x / GRID) * GRID,
        Math.round(currPos.y / GRID) * GRID,
        Math.round(currPos.z / GRID) * GRID
      );

      activeSnapTween = gsap.to(currPos, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.4,
        ease: "circ.inOut",
        onComplete: () => { activeSnapTween = null; }
      });
    });

    const preview = CreateBox("layerPreview", {
      size: 2.5
    }, this.builderUI.connectedNet.scene);

    const previewMat = new StandardMaterial("layerPreviewMat", this.builderUI.connectedNet.scene);
    previewMat.diffuseColor = new Color3(0x2a / 255, 0x9d / 255, 0xff / 255);
    previewMat.alpha = 0.6;

    preview.material = previewMat;

    preview.enableEdgesRendering();
    preview.edgesWidth = 10;
    preview.edgesColor = new Color4(1, 1, 1, 1);

    gizmo.attachedMesh = preview;

    preview.setParent(this.builderUI.connectedNet.networkRoot);
    //Layer Preview End

    //Shape Start
    this.builderUI.createLayer.shape.forward.setCallback((next) => {
      this.state.builder.createLayerMenu.shape.forward = this.builderUI.createLayer.shape.forward.getValue();

      if (next * this.builderUI.createLayer.shape.vertical.getValue() * this.builderUI.createLayer.shape.horizontal.getValue() > 999) return false;

      gsap.to(preview.scaling, {
        x: next || 1,
        ease: "circ.inOut",
        duration: 0.2,
        overwrite: "auto"
      })
      return true;
    });
    this.builderUI.createLayer.shape.vertical.setCallback((next) => {
      this.state.builder.createLayerMenu.shape.vertical = this.builderUI.createLayer.shape.vertical.getValue();

      if (this.builderUI.createLayer.shape.forward.getValue() * next * this.builderUI.createLayer.shape.horizontal.getValue() > 999) return false;

      gsap.to(preview.scaling, {
        y: next || 1,
        ease: "circ.inOut",
        duration: 0.2,
        overwrite: "auto"
      })
      return true;
    });
    this.builderUI.createLayer.shape.horizontal.setCallback((next) => {
      this.state.builder.createLayerMenu.shape.horizontal = this.builderUI.createLayer.shape.horizontal.getValue();

      if (this.builderUI.createLayer.shape.forward.getValue() * this.builderUI.createLayer.shape.vertical.getValue() * next > 999) return false;

      gsap.to(preview.scaling, {
        z: next || 1,
        ease: "circ.inOut",
        duration: 0.2,
        overwrite: "auto"
      })
      return true;
    });
    //Shape End

    //Builder End
  }

  setForwardDirection(dir: ForwardDirection) {
    if (this.state.builder.settings.forwardDirection === dir) return;
    if (this.forwardDirTweening) return;

    const current = DIRECTION_YAW_PITCH[this.state.builder.settings.forwardDirection];
    const target = DIRECTION_YAW_PITCH[dir];

    const proxy = { yaw: current!.yaw, pitch: current!.pitch };

    const tl = gsap.timeline({
      onStart: () => { this.forwardDirTweening = true; },
      onComplete: () => { this.forwardDirTweening = false; },
      onUpdate: () => {
        this.builderUI.connectedNet.networkRoot.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), proxy.yaw).multiply(Quaternion.RotationAxis(Vector3.Forward(), proxy.pitch));
      },
    });

    if (target!.yaw !== current!.yaw) {
      tl.to(proxy, { yaw: target!.yaw, duration: 0.6, ease: "circ.inOut" });
    }
    if (target!.pitch !== current!.pitch) {
      tl.to(proxy, { pitch: target!.pitch, duration: 0.6, ease: "circ.inOut" });
    }

    this.state.builder.settings.forwardDirection = dir;
  }

}