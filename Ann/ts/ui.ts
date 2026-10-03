import { gsap } from "gsap";

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";


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

  networkRoot: TransformNode;
  
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
  shape: {
    rootSelector: string;
  };
  pos: {
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

  networkRoot: TransformNode;
  
  actions: {
    addLayer: HTMLButtonElement;
  }

  createLayer: LayerCreationMenu;
  
  settings: {
    forwardDirButtons: {
      px: HTMLButtonElement, nx: HTMLButtonElement,
      py: HTMLButtonElement, ny: HTMLButtonElement,
      pz: HTMLButtonElement, nz: HTMLButtonElement,
    };
  }
}

interface LayerCreationMenu {
  shape: {
    forward: NumberInputUI;
    vertical: NumberInputUI;
    horizontal: NumberInputUI;
  };
  pos: {
    forward: NumberInputUI;
    vertical: NumberInputUI;
    horizontal: NumberInputUI;
  }
}


interface UIState {
  settings: {
    panelToggled: boolean; //whether the settings menu is shown or not
    darkMode: boolean;
  }
  builder: {
    panelToggled: boolean;
    createLayerMenuToggled: boolean;

    createLayerMenu: {
      shape: {
        forward: number;
        vertical: number;
        horizontal: number;
      };
      pos: {
        forward: number;
        vertical: number;
        horizontal: number;
      };
    };
    
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
        darkMode: true
      },
      builder: {
        panelToggled: false,
        createLayerMenuToggled: false,

        createLayerMenu: {
          shape: {
            forward: 1,
            vertical: 1,
            horizontal: 1
          },
          pos: {
            forward: 0,
            vertical: 0,
            horizontal: 0
          }
        },
        
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

      createLayer: {
        shape: {
          forward: new NumberInputUI({ 
            rootSelector: builderConfig.createLayerMenuConfig.shape.rootSelector,
            initial: 1, min: 1, max: 10
          }),
          vertical: new NumberInputUI({ 
            rootSelector: builderConfig.createLayerMenuConfig.shape.rootSelector,
            initial: 1, min: 1, max: 10
          }),
          horizontal: new NumberInputUI({ 
            rootSelector: builderConfig.createLayerMenuConfig.shape.rootSelector,
            initial: 1, min: 1, max: 10
          })
        },
        pos: {
          forward: new NumberInputUI({ 
            rootSelector: builderConfig.createLayerMenuConfig.pos.rootSelector,
            initial: 1, min: undefined, max: undefined
          }),
          vertical: new NumberInputUI({ 
            rootSelector: builderConfig.createLayerMenuConfig.pos.rootSelector,
            initial: 1, min: undefined, max: undefined
          }),
          horizontal: new NumberInputUI({ 
            rootSelector: builderConfig.createLayerMenuConfig.pos.rootSelector,
            initial: 1, min: undefined, max: undefined
          })
        }
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
    //Main UI Togglers End

    //Builder Start
    this.builderUI.settings.forwardDirButtons.px.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveX); });
    this.builderUI.settings.forwardDirButtons.py.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveY); });
    this.builderUI.settings.forwardDirButtons.pz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveZ); });
    this.builderUI.settings.forwardDirButtons.nx.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeX); });
    this.builderUI.settings.forwardDirButtons.ny.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeY); });
    this.builderUI.settings.forwardDirButtons.nz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeZ); });
    
     
    this.builderUI.createLayer.shape.forward.setCallback(() => { this.state.builder.createLayerMenu.shape.forward = this.builderUI.createLayer.shape.forward.getValue(); });
    this.builderUI.createLayer.shape.vertical.setCallback(() => { this.state.builder.createLayerMenu.shape.vertical = this.builderUI.createLayer.shape.vertical.getValue(); });
    this.builderUI.createLayer.shape.horizontal.setCallback(() => { this.state.builder.createLayerMenu.shape.horizontal = this.builderUI.createLayer.shape.horizontal.getValue(); });
    
    this.builderUI.createLayer.pos.forward.setCallback(() => { this.state.builder.createLayerMenu.pos.forward = this.builderUI.createLayer.pos.forward.getValue(); });
    this.builderUI.createLayer.pos.vertical.setCallback(() => { this.state.builder.createLayerMenu.pos.vertical = this.builderUI.createLayer.pos.vertical.getValue(); });
    this.builderUI.createLayer.pos.horizontal.setCallback(() => { this.state.builder.createLayerMenu.pos.horizontal = this.builderUI.createLayer.pos.horizontal.getValue(); });
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
        this.builderUI.networkRoot.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), proxy.yaw).multiply(Quaternion.RotationAxis(Vector3.Forward(), proxy.pitch));
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


interface NumberInputConfig {
  rootSelector: string;
  
  initial: number;
  min: number | undefined;
  max: number | undefined;

  /* undefined means none
     max = undefined => No upper limit
     min = undefined => No lower limit */
}

//SET UP DOCUMENT LEVEL POINTER CAPTURE ON LAPTOP : NO ISSUES ON TOUCH DEVICE(TABLET)

export class NumberInputUI {
  private value: number;

  private callback: () => void;

  // private incrementing: boolean;
  private incrementIntervalId: number | undefined;
  private incrementTimeoutId: number | undefined;
  // private decrementing: boolean;
  private decrementIntervalId: number | undefined;
  private decrementTimeoutId: number | undefined;

  constructor(numberInputConfig: NumberInputConfig) {
    //Init Start
    this.value = numberInputConfig.initial ?? 1;

    this.callback = () => {};
    
    
    const incrementerId = `${crypto.randomUUID()}-num-input-button`;
    const decrementerId = `${crypto.randomUUID()}-num-input-button`;

    const valueId = `${crypto.randomUUID()}-num-input-value`;
    
    const numInputDiv = document.createElement("div");
    numInputDiv.classList.add("number-input");
    numInputDiv.innerHTML = `
      <button id="${incrementerId}">
        <svg viewBox="0 0 6 6">
          <path
            d="M 1 5 L 3 3 M 3 3 L 5 5"
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke="#fff"
          />
        </svg>
      </button>

      <label id="${valueId}" class="number-input">${this.value}</label>

      <button id="${decrementerId}">
        <svg viewBox="0 0 6 6">
          <path
            d="M 1 5 L 3 3 M 3 3 L 5 5"
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke="#fff"
            transform-origin="center"
            transform="rotate(180)"
          />
        </svg>
      </button>
    `;

    document.querySelector(numberInputConfig.rootSelector)!.append(numInputDiv);
    
    const valueEl = document.getElementById(valueId);
    //Init En-d000

    //Incrementer Start
    const incrementer = document.getElementById(incrementerId)!;
    
    incrementer.addEventListener("pointerdown", () => {
      if (this.value == numberInputConfig.max) return;
      this.value += 1;
      valueEl!.textContent = `${this.value}`;
      this.callback();
      
      this.incrementIntervalId = setInterval(() => {
        if (this.value == numberInputConfig.max) return;
        this.value += 1;
        valueEl!.textContent = `${this.value}`;
        this.callback();
      }, 600);

      this.incrementTimeoutId = setTimeout(() => {
        clearInterval(this.incrementIntervalId);
        
        this.incrementIntervalId = setInterval(() => {
          if (this.value == numberInputConfig.max) return;
          this.value += 1;
          valueEl!.textContent = `${this.value}`;
          this.callback();
        }, 150);
        
        this.incrementTimeoutId = setTimeout(() => {
          clearInterval(this.incrementIntervalId);
          
          this.incrementIntervalId = setInterval(() => {
            if (this.value == numberInputConfig.max) return;
            this.value += 1;
            valueEl!.textContent = `${this.value}`;
            this.callback();
          }, 60);
        }, 600)
      }, 500);
    });
    
    incrementer.addEventListener("pointerup", () => {
      if (this.incrementIntervalId) {
        clearInterval(this.incrementIntervalId);
        this.incrementIntervalId = undefined;
      }
      if (this.incrementTimeoutId) {
        clearTimeout(this.incrementTimeoutId);
        this.incrementTimeoutId = undefined;
      }
    });
    
    incrementer.addEventListener("pointerleave", () => {
      if (this.incrementIntervalId) {
        clearInterval(this.incrementIntervalId);
        this.incrementIntervalId = undefined;
      }
      if (this.incrementTimeoutId) {
        clearTimeout(this.incrementTimeoutId);
        this.incrementTimeoutId = undefined;
      }
    });

    incrementer.addEventListener("pointercancel", () => {
      if (this.incrementIntervalId) {
        clearInterval(this.incrementIntervalId);
        this.incrementIntervalId = undefined;
      }
      if (this.incrementTimeoutId) {
        clearTimeout(this.incrementTimeoutId);
        this.incrementTimeoutId = undefined;
      }
    });
    //Incrementer End
    
    //Decrementer Start
    const decrementer = document.getElementById(decrementerId)!;

    decrementer.addEventListener("pointerdown", () => {
      if (this.value == numberInputConfig.min) return;
      this.value -= 1;
      valueEl!.textContent = `${this.value}`;
      this.callback();
      
      this.decrementIntervalId = setInterval(() => {
        if (this.value == numberInputConfig.min) return;
        this.value -= 1;
        valueEl!.textContent = `${this.value}`;
        this.callback();
      }, 600);

      this.decrementTimeoutId = setTimeout(() => {
        clearInterval(this.decrementIntervalId);
        
        this.decrementIntervalId = setInterval(() => {
          if (this.value == numberInputConfig.min) return;
          this.value -= 1;
          valueEl!.textContent = `${this.value}`;
          this.callback();
        }, 150);
        
        this.decrementTimeoutId = setTimeout(() => {
          clearInterval(this.decrementIntervalId);
          
          this.decrementIntervalId = setInterval(() => {
            if (this.value == numberInputConfig.min) return;
            this.value -= 1;
            valueEl!.textContent = `${this.value}`;
            this.callback();
          }, 60);
        }, 600)
      }, 500);
    });
    
    decrementer.addEventListener("pointerup", () => {
      if (this.decrementIntervalId) {
        clearInterval(this.decrementIntervalId);
        this.decrementIntervalId = undefined;
      }
      if (this.decrementTimeoutId) {
        clearTimeout(this.decrementTimeoutId);
        this.decrementTimeoutId = undefined;
      }
    });

    decrementer.addEventListener("pointerleave", () => {
      if (this.decrementIntervalId) {
        clearInterval(this.decrementIntervalId);
        this.decrementIntervalId = undefined;
      }
      if (this.decrementTimeoutId) {
        clearTimeout(this.decrementTimeoutId);
        this.decrementTimeoutId = undefined;
      }
    });
    decrementer.addEventListener("pointercancel", () => {
      if (this.decrementIntervalId) {
        clearInterval(this.decrementIntervalId);
        this.decrementIntervalId = undefined;
      }
      if (this.decrementTimeoutId) {
        clearTimeout(this.decrementTimeoutId);
        this.decrementTimeoutId = undefined;
      }
    });
    //Decrementer End
  }

  getValue() {
    return this.value;
  }

  setCallback(callback: () => void) {
    this.callback = callback;
  }
}