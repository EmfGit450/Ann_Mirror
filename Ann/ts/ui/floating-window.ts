import { NumberInputUI } from "./number-input";

interface FloatingWindowUIConfig {
  rootSelector: string;

  children: HTMLElement[];
  attrs: {
    id: string | undefined,
    classlist: string[] | undefined
  } | undefined;
  stylesObject: object | undefined;

  startPos: { x: number, y: number };
}

export class FloatingWindowUI {
  state: {
    zIndex: number;

    pointerId: number | undefined;
    isDragging: boolean;
    cursorMoveSet: boolean;

    clientX: number;
    clientY: number;

    transX: number;
    transY: number;
  };

  children: HTMLElement[];

  data: object | undefined;

  constructor(config: FloatingWindowUIConfig) {
    this.state = {
      zIndex: 3,

      pointerId: undefined,
      isDragging: false,
      cursorMoveSet: false,

      clientX: 0,
      clientY: 0,

      transX: config.startPos.x,
      transY: config.startPos.y
    }
    
    this.children = config.children;

    const window = document.createElement("div");

    window.classList.add("floating-window");
    if (config.attrs) {
      if (config.attrs.id) window.setAttribute("id", config.attrs.id);
      if (config.attrs.classlist) config.attrs.classlist.forEach(classStr => { window.classList.add(classStr); });
    }

    Object.assign(window.style, {
      width:"208px",
      height: "272px",
      background: "#0d0d0dfa",
      padding: "0.8rem",
      border: "1px solid #fff",
      borderRadius: "0.7rem",
      zIndex: "3"
    });

    //Modifies default
    Object.assign(window.style, config.stylesObject);

    window.style.position = "fixed";

    this.state.zIndex = parseInt(window.style.zIndex);

    window.style.transform = `translate(${this.state.transX}px, ${this.state.transY}px)`;


    const dragger = document.createElement("button");
    dragger.innerHTML = `
      <svg viewBox="0 0 24 24" stroke="#000" stroke-width="1.5" stroke-linecap="round">
        <path d="M 2 12 L 22 12 M 12 2 L 12 22 M 2 12 L 5 15 M 2 12 L 5 9 M 22 12 L 19 15 M 22 12 L 19 9 M 12 2 L 15 5 M 12 2 L 9 5 M 12 22 L 9 19 M 12 22 L 15 19"/>
      </svg>
    `;

    dragger.style.cursor = "move"; 

    document.addEventListener("pointerdown", (e) => {
      if (!dragger.contains(e.target as Node)) return;

      this.state.pointerId = e.pointerId;
      this.state.isDragging = true;

      this.state.clientX = e.clientX;
      this.state.clientY = e.clientY;
    }, { capture: true });

    document.addEventListener("pointermove", (e) => {
      if (e.pointerId != this.state.pointerId || !this.state.isDragging) return;

      if (!this.state.cursorMoveSet) {
        document.body.style.cursor = "move";
        this.state.cursorMoveSet = true;
      }


      const newCX = e.clientX;
      const newCY = e.clientY;

      this.state.transX += newCX - this.state.clientX;
      this.state.transY += newCY - this.state.clientY;

      window.style.transform = `translate(${this.state.transX}px, ${this.state.transY}px)`;

      this.state.clientX = newCX;
      this.state.clientY = newCY;
    });

    const onup = () => {
      this.state.isDragging = false;
      this.state.pointerId = undefined;
      this.state.cursorMoveSet = false;
      document.body.style.cursor = "auto";
    }

    document.addEventListener("pointerup", onup);
    document.addEventListener("pointercancel", onup);

    window.append(dragger, ...config.children);

    document.querySelector(config.rootSelector)!.append(window);
  }
}


interface LayerCreationWindowsUIConfig {
  maxWindows: number;
  baseZindex: number;

  spawnStartPos: { x: number, y: number };
}

class LayerCreationWindowsUI {
  windows: FloatingWindowUI[];

  windowCount: number;

  maxWindows: number;
  baseZindex: number;

  constructor(config: LayerCreationWindowsUIConfig) {
    this.windows = [];

    this.windowCount = 0;

    this.maxWindows = config.maxWindows;
    this.baseZindex = config.baseZindex;
  }

  newWindow() {
    if (this.windowCount == this.maxWindows) {
      console.error("Maximum window count reached");
      return;
    }

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

    const floatingWindow = new FloatingWindowUI({
      rootSelector: "body",

      children: [activationConfig, shapeConfig],
      attrs: undefined,
      stylesObject: { zIndex: this.baseZindex },
      startPos: { x: 0, y: 0 }
    });

     const numberInput1 = new NumberInputUI({
      rootSelector: undefined,
      rootElement: shapeNumberInputs,

      initial: 1, min: 1, max: 1000
     });
    
  }
}