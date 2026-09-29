import { gsap } from "gsap";

import type { AxesViewer } from "@babylonjs/core/Debug/axesViewer";

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

interface EditorState {
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


export class UI {
  quickHelpersUI: QuickHelpersUI;
  settingsUI: SettingsUI;
  builderUI: BuilderUI;

  state: EditorState;

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
    //Init End

    //Main UI Togglers Start
    this.settingsUI.toggler.addEventListener("click", () => {
      this.state.settings.panelToggled = !this.state.settings.panelToggled;
      
      gsap.to(this.settingsUI.root, {
        xPercent: this.state.settings.panelToggled ? 0 : 100, //100 - to the right
        duration: 0.3,
        ease: "expo.inOut"
      });
    });

    this.builderUI.toggler.addEventListener("click", () => {
      this.state.builder.panelToggled = !this.state.builder.panelToggled;

      gsap.to(this.builderUI.root, {
        xPercent: this.state.builder.panelToggled ? 0 : -100, //to the left
        duration: 0.3,
        ease: "expo.inOut"
      });
    });
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
}