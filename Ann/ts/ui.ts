import { gsap } from "gsap";


import { EditorState, ForwardDirection } from "./states";


export class UI {
  quickHelpersUI: QuickHelpersUI;
  settingsUI: SettingsUI;
  builderUI: BuilderUI;

  state: EditorState;
}

export class QuickHelpersUI {
  root: HTMLElement;
  helpers!: {
    axesHelperButton: HTMLElement;
  }
  callbacks!: {
    axesHelperCallback: () => void;
  }

  constructor(config: {
    rootSelector: string;
  }, helperSelectors: {
    axesHelperBtnSelector: string;
  }, helperCallbacks: {
    axesHelperCallback: () => void;
  }) {
    this.root = document.querySelector(config.rootSelector);

    this.helpers.axesHelperButton = document.querySelector(helperSelectors.axesHelperBtnSelector);
    
    this.callbacks.axesHelperCallback = helperCallbacks.axesHelperCallback;
    
    this.helpers.axesHelperButton.addEventListener("click", () => {
      this.callbacks.axesHelperCallback();
    });
  }
}

export class SettingsUI {
  
}