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

    transX: number;
    transY: number;
  };

  data: object;

  constructor(config: FloatingWindowUIConfig) {
    this.state.pointerId = undefined;
    this.state.isDragging = false;

    this.state.clientX = 0;
    this.state.clientY = 0;

    const window = document.createElement("div");

    window.classList.add("floating-window");
    if (config.attrs) {
      if (config.attrs.id) window.setAttribute("id", config.attrs.id);
      if (config.attrs.classlist) config.attrs.classlist.forEach(classStr => { window.classList.add(classStr); });
    }

    window.style.cssText = config.styleString ?? `
      min-width: 13rem;
      min-height: 17rem;
      background: #0d0d0dfa;
      padding: 0.8rem;
      border: 1px solid #fff;
      border-radius: 0.7rem;
      z-index: 3;
    `;
    window.style.position = "fixed";

    const regexp = /z-index: \d/;
    this.zIndex = parseInt(window.style.cssText.match(regexp)[0].split(" ")[1]);

    this.state.transX = config.startPos.x;
    this.state.transY = config.startPos.y;

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

      this.state.transX += newCX - this.state.clientX;
      this.state.transY += newCY - this.state.clientY;

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


    for (let child of config.children) window.append(child);

    document.querySelector(config.rootSelector)!.append(window);
  }
}


interface DependentFloatingWindowUIConfig {
  rootSelector: string;

  children: HTMLElement[];
  attrs: {
    id: string | undefined,
    classlist: string[] | undefined
  } | undefined;
  styleString: string | undefined;

  startPos: { x: number, y: number };
}

export class DependentFloatingWindowUI {
  pointerId: number | undefined;
  isDragging: boolean;

  clientX: number;
  clientY: number;

  transX: number;
  transY: number;

  constructor(config: FloatingWindowUIConfig) {
    this.pointerId = undefined;
    this.isDragging = false;

    this.clientX = 0;
    this.clientY = 0;

    const window = document.createElement("div");

    window.classList.add("floating-window");
    if (config.attrs) {
      if (config.attrs.id) window.setAttribute("id", config.attrs.id);
      if (config.attrs.classlist) config.attrs.classlist.forEach(classStr => { window.classList.add(classStr); });
    }

    window.style = config.styleString ?? `
      min-width: 13rem;
      min-height: 17rem;
      background: #0d0d0dfa;
      padding: 0.8rem;
      border: 1px solid #fff;
      border-radius: 0.7rem;
      z-index: 3;
    `;
    window.style.position = "fixed";

    this.transX = config.startPos.x;
    this.transY = config.startPos.y;

    window.style.transform = `translate(${this.transX}px, ${this.transY}px)`;


    const dragger = document.createElement("button");
    dragger.innerHTML = `
      <svg viewBox="0 0 24 24" stroke="#000" stroke-width="1.5" stroke-linecap="round">
        <path d="M 2 12 L 22 12 M 12 2 L 12 22 M 2 12 L 5 15 M 2 12 L 5 9 M 22 12 L 19 15 M 22 12 L 19 9 M 12 2 L 15 5 M 12 2 L 9 5 M 12 22 L 9 19 M 12 22 L 15 19"/>
      </svg>
    `;

    document.addEventListener("pointerdown", (e) => {
      if (!dragger.contains(e.target as Node)) return;

      this.pointerId = e.pointerId;
      this.isDragging = true;

      this.clientX = e.clientX;
      this.clientY = e.clientY;
    }, { capture: true });

    document.addEventListener("pointermove", (e) => {
      if (e.pointerId != this.pointerId || !this.isDragging) return;

      const newCX = e.clientX;
      const newCY = e.clientY;

      this.transX += newCX - this.clientX;
      this.transY += newCY - this.clientY;

      window.style.transform = `translate(${this.transX}px, ${this.transY}px)`;

      this.clientX = newCX;
      this.clientY = newCY;
    });

    document.addEventListener("pointerup", () => { this.isDragging = false; this.pointerId = undefined; });

    document.addEventListener("pointercancel", () => { this.isDragging = false; this.pointerId = undefined; });

    window.append(dragger);


    for (let child of config.children) window.append(child);

    document.querySelector(config.rootSelector)!.append(window);
  }
}