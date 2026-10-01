import { gsap } from "gsap";


import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";


interface SettingsConfig {
  rootSelector: string;
  togglerSelector: string;
  
  settingsSelectors: {
    themeToggle: string;
  }
}

interface BuilderConfig {
  rootSelector: string;
  togglerSelector: string;

  networkRoot: TransformNode;
  
  actionButtonSelectors: {
    addLayerSelector: string;
  }
  settings: {
    forwardDirButtonSelectors: {
      px: string, nx: string,
      py: string, ny: string,
      pz: string, nz: string,
    }
  }
}

interface SettingsUI {
  root: HTMLElement;
  toggler: HTMLButtonElement;
  
  settings: {
    themeToggle: HTMLButtonElement;
  }
}

interface BuilderUI {
  root: HTMLElement;
  toggler: HTMLButtonElement;

  networkRoot: TransformNode;
  
  actions: {
    addLayer: HTMLButtonElement;
  }
  settings: {
    forwardDirButtons: {
      px: HTMLButtonElement, nx: HTMLButtonElement,
      py: HTMLButtonElement, ny: HTMLButtonElement,
      pz: HTMLButtonElement, nz: HTMLButtonElement,
    };
  }
}

interface UIState {
  settings: {
    panelToggled: boolean; //whether the settings menu is shown or not
    darkMode: boolean;
  }
  builder: {
    panelToggled: boolean;
    settings: {
      forwardDirection: ForwardDirection;
    }
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
        darkMode: true
      },
      builder: {
        panelToggled: false,
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

      networkRoot: builderConfig.networkRoot,
      
      actions: {
        addLayer: document.querySelector(builderConfig.actionButtonSelectors.addLayerSelector)!
      },
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

    this.builderUI.networkRoot.rotationQuaternion = Quaternion.Identity();
    //Init End

    //Main UI Togglers Start
    this.settingsUI.toggler.addEventListener("click", () => {
      this.state.settings.panelToggled = !this.state.settings.panelToggled;
      
      gsap.to(this.settingsUI.root, {
        xPercent: this.state.settings.panelToggled ? 0 : 100,
        duration: 0.3,
        ease: "expo.inOut"
      });
      gsap.to(this.settingsUI.toggler.parentElement, {
        x: this.state.settings.panelToggled ? "-13rem" : 0,
        duration: 0.3,
        ease: "expo.inOut"
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
        x: this.state.builder.panelToggled ? "13rem" : 0,
        duration: 0.3,
        ease: "circ.inOut"
      });
    });
    
    this.builderUI.settings.forwardDirButtons.px.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveX); });
    this.builderUI.settings.forwardDirButtons.py.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveY); });
    this.builderUI.settings.forwardDirButtons.pz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveZ); });
    this.builderUI.settings.forwardDirButtons.nx.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeX); });
    this.builderUI.settings.forwardDirButtons.ny.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeY); });
    this.builderUI.settings.forwardDirButtons.nz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeZ); });
    //Main UI Togglers End
  }

  setForwardDirection(dir: ForwardDirection) {
    if (this.state.builder.settings.forwardDirection === dir) return;
    if (this.forwardDirTweening) return;

    const current = DIRECTION_YAW_PITCH[this.state.builder.settings.forwardDirection];
    const target = DIRECTION_YAW_PITCH[dir];

    const proxy = { yaw: current.yaw, pitch: current.pitch };

    const tl = gsap.timeline({
      onStart: () => { this.forwardDirTweening = true; },
      onComplete: () => { this.forwardDirTweening = false; },
      onUpdate: () => {
        this.builderUI.networkRoot.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), proxy.yaw).multiply(Quaternion.RotationAxis(Vector3.Forward(), proxy.pitch));
      },
    });
    
    if (target.yaw !== current.yaw) {
      tl.to(proxy, { yaw: target.yaw, duration: 0.6, ease: "circ.inOut" });
    }
    if (target.pitch !== current.pitch) {
      tl.to(proxy, { pitch: target.pitch, duration: 0.6, ease: "circ.inOut" });
    }
    
    this.state.builder.settings.forwardDirection = dir;
  }
  
}