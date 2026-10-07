import { gsap } from "gsap";

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";


type None = undefined;

type CommitBool = boolean;


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
            initial: 1, min: 1, max: 1000
          }),
          vertical: new NumberInputUI({ 
            rootSelector: builderConfig.createLayerMenuConfig.shape.rootSelector,
            initial: 1, min: 1, max: 1000
          }),
          horizontal: new NumberInputUI({ 
            rootSelector: builderConfig.createLayerMenuConfig.shape.rootSelector,
            initial: 1, min: 1, max: 1000
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
    this.builderUI.settings.forwardDirButtons.px.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveX); });
    this.builderUI.settings.forwardDirButtons.py.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveY); });
    this.builderUI.settings.forwardDirButtons.pz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.PositiveZ); });
    this.builderUI.settings.forwardDirButtons.nx.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeX); });
    this.builderUI.settings.forwardDirButtons.ny.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeY); });
    this.builderUI.settings.forwardDirButtons.nz.addEventListener("click", () => { this.setForwardDirection(ForwardDirection.NegativeZ); });

    this.builderUI.createLayer.shape.forward.setCallback((next) => next * this.builderUI.createLayer.shape.vertical.getValue() * this.builderUI.createLayer.shape.horizontal.getValue() <= 1000);
    this.builderUI.createLayer.shape.vertical.setCallback((next) => this.builderUI.createLayer.shape.forward.getValue() * next * this.builderUI.createLayer.shape.horizontal.getValue() <= 1000);
    this.builderUI.createLayer.shape.horizontal.setCallback((next) => this.builderUI.createLayer.shape.forward.getValue() * this.builderUI.createLayer.shape.vertical.getValue() * next <= 1000);
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
  min: number | None;
  max: number | None;
}

export class NumberInputUI {
  private value: number;

  private callback: (next: number) => CommitBool;

  
  private incrementIntervalId: number | undefined;
  private incrementTimeoutId: number | undefined;

  private decrementIntervalId: number | undefined;
  private decrementTimeoutId: number | undefined;
  

  constructor(config: NumberInputConfig) {
    //Init Start
    this.value = config.initial ?? 1;
    
    //@ts-ignore
    this.callback = (next: number): CommitBool => { return true; };
    
    const numInputDiv = document.createElement("div");
    numInputDiv.classList.add("number-input");
    numInputDiv.innerHTML = `
      <button class="number-input-incrementer">
        <svg viewBox="0 0 6 6">
          <path
            d="M 1 5 L 3 3 M 3 3 L 5 5"
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke="#fff"
          />
        </svg>
      </button>

      <label class="number-input-value" class="number-input">${this.value}</label>

      <button class="number-input-decrementer">
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

    document.querySelector(config.rootSelector)!.append(numInputDiv);

    const incrementer = numInputDiv.children[0]!;
    const valueEl = numInputDiv.children[1]!;
    const decrementer = numInputDiv.children[2]!;

    this.setValue = (num: number) => {
      this.value = Math.min(config.max ?? Infinity, Math.max(config.min ?? -Infinity, num));
      valueEl.textContent = `${this.value}`;
    }
    //Init End

    //Incrementer Start
    incrementer.addEventListener("pointerdown", () => {
      if(this.callback(this.value + 1) == false) return;
      
      if (this.value == config.max) return;
      this.value += 1;
      valueEl!.textContent = `${this.value}`;
      
      this.incrementIntervalId = setInterval(() => {
        if(this.callback(this.value + 1) == false) return;
        
        if (this.value == config.max) return;
        this.value += 1;
        valueEl!.textContent = `${this.value}`;
      }, 600);

      this.incrementTimeoutId = setTimeout(() => {
        clearInterval(this.incrementIntervalId);
        
        this.incrementIntervalId = setInterval(() => {
          if(this.callback(this.value + 1) == false) return;
          
          if (this.value == config.max) return;
          this.value += 1;
          valueEl!.textContent = `${this.value}`;
        }, 150);
        
        this.incrementTimeoutId = setTimeout(() => {
          clearInterval(this.incrementIntervalId);
          
          this.incrementIntervalId = setInterval(() => {
            if (this.callback(this.value + 1) == false) return;
            
            if (this.value == config.max) return;
            this.value += 1;
            valueEl!.textContent = `${this.value}`;
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
    decrementer.addEventListener("pointerdown", () => {
      if (this.callback(this.value - 1) == false) return;
      
      if (this.value == config.min) return;
      this.value -= 1;
      valueEl!.textContent = `${this.value}`;
      
      this.decrementIntervalId = setInterval(() => {
        if (this.callback(this.value - 1) == false) return;
        
        if (this.value == config.min) return;
        this.value -= 1;
        valueEl!.textContent = `${this.value}`;
      }, 600);

      this.decrementTimeoutId = setTimeout(() => {
        clearInterval(this.decrementIntervalId);
        
        this.decrementIntervalId = setInterval(() => {
          if (this.callback(this.value - 1) == false) return;
          
          if (this.value == config.min) return;
          this.value -= 1;
          valueEl!.textContent = `${this.value}`;
        }, 150);
        
        this.decrementTimeoutId = setTimeout(() => {
          clearInterval(this.decrementIntervalId);
          
          this.decrementIntervalId = setInterval(() => {
            if (this.callback(this.value - 1) == false) return;
            
            if (this.value == config.min) return;
            this.value -= 1;
            valueEl!.textContent = `${this.value}`;
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

  setValue: (num: number) => void;

  setCallback(callback: (next: number) => CommitBool) {
    this.callback = callback;
  }
}