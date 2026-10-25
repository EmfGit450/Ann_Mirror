interface FloatingWindowUIConfig {
  rootSelector: string;

  children: HTMLElement[];
  styleString: string | undefined;

  startPos: { x: number, y: number };
}

export class FloatingWindowUI {
  constructor(config: FloatingWindowUIConfig) {
    const window = document.createElement("div");
    window.classList.add("floating-window");
    window.style = config.styleString ?? `
      min-width: 13rem;
      min-height: 17rem;
      background: #0d0d0dfa;
      padding: 0.8rem;
      border: 1px solid #fff;
      border-radius: 0.3rem;
    `;
    window.style.position = "fixed";
    window.style.transform = `translate(${config.startPos.x}px, ${config.startPos.y}px)`;

    const dragger = document.createElement("button");
    dragger.innerHTML = `
      <svg viewBox="0 0 24 24" stroke="#000" stroke-width="1.5" stroke-linecap="round">
        <path d="M 2 12 L 22 12 M 12 2 L 12 22 M 2 12 L 5 15 M 2 12 L 5 9 M 22 12 L 19 15 M 22 12 L 19 9 M 12 2 L 15 5 M 12 2 L 9 5 M 12 22 L 9 19 M 12 22 L 15 19"/>
      </svg>
    `
    window.append(dragger);

    for (let child of config.children) window.append(child);

    document.querySelector(config.rootSelector)!.append(window);
  }
}