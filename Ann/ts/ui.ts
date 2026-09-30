import { gsap } from "gsap";


import type { AxesViewer } from "@babylonjs/core/Debug/axesViewer";


import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";


interface QuickHelpersConfig {
  rootSelector: string;
  
  helperSelectors: {
    axesHelperSelector: string;
  };
  helperHooks: {
    bjsAxesViewer: AxesViewer;
  }
}

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


interface QuickHelpersUI {
  root: HTMLElement
  
  helpers: {
    axesHelper: HTMLButtonElement;
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
  quickHelpers: {
    axesEnabled: boolean;
  }
}


export const enum ForwardDirection {
  PositiveX, NegativeX,
  PositiveY, NegativeY,
  PositiveZ, NegativeZ,
}

const HALF_PI = Math.PI / 2;

const DIRECTION_QUATS = [
  Quaternion.Identity(),                                    // +X
  Quaternion.RotationAxis(Vector3.Up(), Math.PI),           // -X
  Quaternion.RotationAxis(Vector3.Forward(), HALF_PI),      // +Y
  Quaternion.RotationAxis(Vector3.Forward(), -HALF_PI),     // -Y
  Quaternion.RotationAxis(Vector3.Up(), -HALF_PI),          // +Z
  Quaternion.RotationAxis(Vector3.Up(), HALF_PI),           // -Z
];


export class UI {
  quickHelpersUI: QuickHelpersUI;
  settingsUI: SettingsUI;
  builderUI: BuilderUI;

  state: UIState;

  forwardDirTweening: boolean = false;

  constructor(quickHelpersConfig: QuickHelpersConfig, 
              settingsConfig: SettingsConfig,
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
      },
      quickHelpers: {
        axesEnabled: false
      }
    }
    

    this.quickHelpersUI = {
      root: document.querySelector(quickHelpersConfig.rootSelector)!,
      
      helpers: {
        axesHelper: document.querySelector(quickHelpersConfig.helperSelectors.axesHelperSelector)!
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

    this.builderUI.networkRoot.rotationQuaternion = Quaternion.Identity();
    //Init End

    //Main UI Togglers Start
    this.settingsUI.toggler.addEventListener("click", () => {
      this.state.settings.panelToggled = !this.state.settings.panelToggled;
      
      gsap.to(this.settingsUI.root, {
        xPercent: this.state.settings.panelToggled ? 0 : -100, //100 - to the right
        duration: 0.3,
        ease: "expo.inOut"
      });
    });

    
    this.builderUI.toggler.addEventListener("click", () => {
      this.state.builder.panelToggled = !this.state.builder.panelToggled;

      gsap.to(this.builderUI.root, {
        xPercent: this.state.builder.panelToggled ? 0 : 100, //to the left
        duration: 0.3,
        ease: "expo.inOut"
      });
    });
    
    this.builderUI.settings.forwardDirButtons.px.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveX); });
    this.builderUI.settings.forwardDirButtons.py.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveY); });
    this.builderUI.settings.forwardDirButtons.pz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveZ); });
    this.builderUI.settings.forwardDirButtons.nx.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeX); });
    this.builderUI.settings.forwardDirButtons.ny.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeY); });
    this.builderUI.settings.forwardDirButtons.nz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeZ); });
    //Main UI Togglers End

    //Quick Helpers Setup Start
    this.quickHelpersUI.helpers.axesHelper.addEventListener("click", () => {
      this.state.quickHelpers.axesEnabled = !this.state.quickHelpers.axesEnabled;

      if (this.state.quickHelpers.axesEnabled) {
        quickHelpersConfig.helperHooks.bjsAxesViewer.xAxis.setEnabled(true);
        quickHelpersConfig.helperHooks.bjsAxesViewer.yAxis.setEnabled(true);
        quickHelpersConfig.helperHooks.bjsAxesViewer.zAxis.setEnabled(true);
      }
      else {
        quickHelpersConfig.helperHooks.bjsAxesViewer.xAxis.setEnabled(false);
        quickHelpersConfig.helperHooks.bjsAxesViewer.yAxis.setEnabled(false);
        quickHelpersConfig.helperHooks.bjsAxesViewer.zAxis.setEnabled(false);
      }
    });
    //Quick Helpers Setup End
  }

  setForwardDirection(dir: ForwardDirection) {
    if (this.state.builder.settings.forwardDirection != dir) {
      const current = DIRECTION_QUATS[this.state.builder.settings.forwardDirection];
      const target = DIRECTION_QUATS[dir];

      const proxy = { t: 0 };

      if (!this.forwardDirTweening) {    
        gsap.to(proxy, {
          t: 1,
          duration: 0.6,
          ease: "circ.inOut",
          onUpdate: () => {
            Quaternion.SlerpToRef(current, target, proxy.t, this.builderUI.networkRoot.rotationQuaternion);
          },
          
          onStart: () => { this.forwardDirTweening = true; },
          onComplete: () => { this.forwardDirTweening = false; }
        });

        this.state.builder.settings.forwardDirection = dir;
      }
    }
  }
  
}