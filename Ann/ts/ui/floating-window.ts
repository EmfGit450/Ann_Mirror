interface FloatingWindowUIConfig {
  rootSelector: string;

  children: HTMLElement[];
  attrs: {
    id: string | undefined,
    classlist: string[] | undefined
  } | undefined;
  styleString: string | undefined;

  startPos: { x: number, y: number };
}

export class FloatingWindowUI {
  state: {
    zIndex: number;

    pointerId: number | undefined;
    isDragging: boolean;

    clientX: number;
    clientY: number;

    deltaX: number;
    deltaY: number;

    transX: number;
    transY: number;
  };

  childIds: string[];

  data: object | undefined;

  constructor(config: FloatingWindowUIConfig) {
    this.state = {
      zIndex: 3,

      pointerId: undefined,
      isDragging: false,

      clientX: 0,
      clientY: 0,

      deltaX: 0,
      deltaY: 0,

      transX: config.startPos.x,
      transY: config.startPos.y
    }

    const window = document.createElement("div");

    window.classList.add("floating-window");
    if (config.attrs) {
      if (config.attrs.id) window.setAttribute("id", config.attrs.id);
      if (config.attrs.classlist) config.attrs.classlist.forEach(classStr => { window.classList.add(classStr); });
    }

    window.style.cssText = config.styleString ?? `
      width: 208px;
      height: 272px;
      background: #0d0d0dfa;
      padding: 0.8rem;
      border: 1px solid #fff;
      border-radius: 0.7rem;
      z-index: 3;
    `;
    window.style.position = "fixed";

    this.state.zIndex = parseInt(window.style.zIndex);

    window.style.transform = `translate(${this.state.transX}px, ${this.state.transY}px)`;


    const dragger = document.createElement("button");
    dragger.innerHTML = `
      <svg viewBox="0 0 24 24" stroke="#000" stroke-width="1.5" stroke-linecap="round">
        <path d="M 2 12 L 22 12 M 12 2 L 12 22 M 2 12 L 5 15 M 2 12 L 5 9 M 22 12 L 19 15 M 22 12 L 19 9 M 12 2 L 15 5 M 12 2 L 9 5 M 12 22 L 9 19 M 12 22 L 15 19"/>
      </svg>
    `;

    document.addEventListener("pointerdown", (e) => {
      if (!dragger.contains(e.target as Node)) return;

      this.state.pointerId = e.pointerId;
      this.state.isDragging = true;

      this.state.clientX = e.clientX;
      this.state.clientY = e.clientY;
    }, { capture: true });

    document.addEventListener("pointermove", (e) => {
      if (e.pointerId != this.state.pointerId || !this.state.isDragging) return;

      const newCX = e.clientX;
      const newCY = e.clientY;

      this.state.deltaX = newCX - this.state.clientX;
      this.state.deltaY = newCY - this.state.clientY;

      this.state.transX += this.state.deltaX;
      this.state.transY += this.state.deltaY;

      console.log(this.state.deltaX, this.state.deltaY);

      window.style.transform = `translate(${this.state.transX}px, ${this.state.transY}px)`;

      this.state.clientX = newCX;
      this.state.clientY = newCY;
    });

    document.addEventListener("pointerup", () => {
      this.state.isDragging = false;
      this.state.pointerId = undefined;
    });

    document.addEventListener("pointercancel", () => {
      this.state.isDragging = false;
      this.state.pointerId = undefined;
    });

    window.append(dragger);

    this.childIds = [];

    for (let child of config.children) {
      if (child.getAttribute("id") == null) child.setAttribute("id", crypto.randomUUID());
      window.append(child);
      this.childIds.push(child.getAttribute("id")!);
    }

    document.querySelector(config.rootSelector)!.append(window);
  }
}


interface FloatingWindowSystemUIConfig {
  windowConfig: FloatingWindowUIConfig;

  maxWindows: number;
  baseZindex: number;

  spawnStartPos: { x: number, y: number };
}

class FloatingWindowSystemUI {
  windowConfig: FloatingWindowUIConfig;
  windowWidth!: number;
  windowHeight!: number;

  windowCount: number;

  maxWindows!: number;
  baseZindex!: number;

  constructor(config: FloatingWindowSystemUIConfig) {
    this.windowConfig = config.windowConfig;

    this.windowCount = 0;

    let wMatch = this.windowConfig.styleString!.match(/width: *;/);
    let wStr: string = (wMatch != null ? wMatch[0].split(" ")[1] : "208px")!;

    let wUnitStr = wStr[wStr.length - 2]! + wStr[wStr.length - 1]!;
    if (wUnitStr != "px") {
      console.error("Width must be given in px");
      return;
    }

    let wNumStr = "";
    for (let i = 0; i < wStr.length - wUnitStr.length; i++) wNumStr += wStr[i];
    this.windowWidth = parseInt(wNumStr);

    let hMatch = this.windowConfig.styleString!.match(/width: *;/);
    let hStr: string = (hMatch != null ? hMatch[0].split(" ")[1] : "272px")!;

    let hUnitStr = hStr[hStr.length - 2]! + hStr[hStr.length - 1]!;
    if (hUnitStr != "px") {
      console.error("Width must be given in px");
      return;
    }

    let hNumStr = "";
    for (let i = 0; i < hStr.length - hUnitStr.length; i++) hNumStr += hStr[i];
    this.windowHeight = parseInt(hNumStr);

    this.maxWindows = config.maxWindows;
    this.baseZindex = config.baseZindex;
  }

  newFloatingWindow() {

  }
}