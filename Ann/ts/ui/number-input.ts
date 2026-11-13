type None = undefined;

type CommitBool = boolean;

interface NumberInputConfig {
  rootSelector: string | undefined;
  rootElement: HTMLElement | undefined;
  
  initial: number;
  min: number | None;
  max: number | None;
}

export class NumberInputUI {
  private value: number;

  private callback: (next: number) => CommitBool | boolean;

  
  private incrementIntervalId: number | undefined;
  private incrementTimeoutId: number | undefined;

  private decrementIntervalId: number | undefined;
  private decrementTimeoutId: number | undefined;
  

  constructor(config: NumberInputConfig) {
    //Init Start
    this.value = config.initial ?? 1;
    
    //@ts-ignore
    this.callback = (next: number): CommitBool => { return true; };

    console.assert(!config.rootSelector && !config.rootElement, "rootSelector and rootElement are undefined, no root to append to");
    console.assert(config.rootSelector != null && config.rootElement != null, "rootSelector and rootElement are defined, root ambiguity");
    
    const numInputDiv = document.createElement("div");
    numInputDiv.classList.add("number-input");
    numInputDiv.innerHTML = `
      <button class="number-input-incrementer">
        <svg viewBox="0 0 6 6">
          <path d="M 1 5 L 3 3 M 3 3 L 5 5" stroke-linejoin="round" stroke-linecap="round" stroke="#fff"/>
        </svg>
      </button>

      <label class="number-input-value" class="number-input">${this.value}</label>

      <button class="number-input-decrementer">
        <svg viewBox="0 0 6 6">
          <path d="M 1 5 L 3 3 M 3 3 L 5 5" stroke-linejoin="round" stroke-linecap="round" stroke="#fff" transform-origin="center" transform="rotate(180)"/>
        </svg>
      </button>
    `;

    if (config.rootSelector) document.querySelector(config.rootSelector!)!.append(numInputDiv);
    else config.rootElement!.append(numInputDiv);

    const incrementer = numInputDiv.children[0]! as HTMLButtonElement;
    const valueEl = numInputDiv.children[1]!;
    const decrementer = numInputDiv.children[2]! as HTMLButtonElement;

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

    const incup = () => {
      if (this.incrementIntervalId) {
        clearInterval(this.incrementIntervalId);
        this.incrementIntervalId = undefined;
      }
      if (this.incrementTimeoutId) {
        clearTimeout(this.incrementTimeoutId);
        this.incrementTimeoutId = undefined;
      }
    }
    
    incrementer.addEventListener("pointerup", incup);
    incrementer.addEventListener("pointerleave", incup);
    incrementer.addEventListener("pointercancel", incup);
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

    const decup = () => {
      if (this.decrementIntervalId) {
        clearInterval(this.decrementIntervalId);
        this.decrementIntervalId = undefined;
      }
      if (this.decrementTimeoutId) {
        clearTimeout(this.decrementTimeoutId);
        this.decrementTimeoutId = undefined;
      }
    }
    
    decrementer.addEventListener("pointerup", decup);
    decrementer.addEventListener("pointerleave", decup);
    decrementer.addEventListener("pointercancel", decup);
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