interface FloatingWindowConfig {
  children: HTMLElement[];
  styleString: string | undefined;

  startPos: { x: number, y: number };
}

class FloatingWindow {
  children: HTMLElement[];

  constructor(config: FloatingWindowConfig) {
    const window = document.createElement("div");
    window.style = config.styleString ?? "background: #0e0e0e88; border-radius: 0.3rem;";
  }
}