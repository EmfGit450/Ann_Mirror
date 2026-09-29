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
  settingsButtonSelectors: {
    themeToggle: string;
  }
}

interface BuilderConfig {
  rootSelector: string;
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
  settings: {
    themeToggle: HTMLButtonElement;
  }
}

interface BuilderUI {
  root: HTMLElement;
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
    app: {
      darkMode: boolean;
    },
    builder: {
      forwardDirection: ForwardDirection;
    }
  },
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
    this.state = {
      settings: {
        app: {
          darkMode: true
        },
        builder: {
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
      settings: {
        themeToggle: document.querySelector(settingsConfig.settingsButtonSelectors.themeToggle)!
      }
    }

    this.builderUI = {
      root: document.querySelector(builderConfig.rootSelector)!,
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
  }
}