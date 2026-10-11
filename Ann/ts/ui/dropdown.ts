import { gsap } from "gsap";

interface DropdownUIConfig {
  rootSelector: string;

  initialValueIndex: number;
  options: string[];
}

export class DropdownUI {
  private value: string;

  private callback: () => void;

  private listToggled: boolean = false;
  
  constructor(config: DropdownUIConfig) {
    this.value = config.options[config.initialValueIndex] as string;
    this.callback = () => {};

    const root = document.createElement("div");
    root.classList.add("dropdown");

    root.innerHTML = `
      <div class="dropdown-value-and-toggler">
        <span class="dropdown-value">${config.options[config.initialValueIndex]}</span>

        <button class="dropdown-toggler">
          <svg viewBox="0 0 6 6">
            <path d="M 3 1 L 1 3 L 3 5" stroke-linejoin="round" stroke-linecap="round" stroke="#000" fill="none" transform="translate(1, 0)"/>
          </svg>
        </button>
      </div>
      
      <div class="dropdown-item-list"></div>
    `;

    const valueTogglerDiv = root.children[0] as HTMLDivElement;

    const toggler = valueTogglerDiv.children[1] as HTMLButtonElement;
    
    const list = root.children[1] as HTMLDivElement;

    config.options.forEach(option => {
      const item = document.createElement("span");
      item.classList.add("dropdown-list-option");

      if (option == config.options[config.initialValueIndex]) {
        item.classList.add("selected");
      }

      item.textContent = option;
      
      list.append(item);

      item.onclick = () => {
        if (item.classList.contains("selected")) return;
        
        item.classList.add("selected");

        for (let i = 0; i < list.children.length; i++) {
          if (list.children[i] == item) continue;

          if (list.children[i]!.classList.contains("selected")) {
            list.children[i]!.classList.remove("selected");
            break;
          }
        }

        this.value = item.textContent;
        valueTogglerDiv.children[0]!.textContent = this.value;
        
        this.callback();
      }
    });
    
    gsap.set(list, { transformOrigin: "50% 0%", scaleY: 0 });

    (list.children[0] as HTMLSpanElement).style.marginTop = "0.7rem";

    toggler.onclick = () => {
      this.listToggled = !this.listToggled;

      gsap.to(list, {
        scaleY: this.listToggled ? 1 : 0,
        opacity: this.listToggled ? 1 : 0,
        ease: "power1.inOut",
        duration: 0.3
      });
      gsap.to(toggler, {
        rotation: this.listToggled ? -90 : 0,
        ease: "power1.inout",
        duration: 0.01
      });
    }

    document.querySelector(config.rootSelector)!.append(root);
  }

  getValue() {
    return this.value;
  }

  setCallback(callback: () => void) {
    this.callback = callback;
  }
}