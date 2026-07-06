class Neuron {
  constructor(props, viewport) {
    this.x = props.x;
    this.y = props.y;
    this.id = crypto.randomUUID();
    this.label = props.label;
    
    this.pig = new PIXI.Graphics().circle(0, 0, 20).fill(0x5F81A8);
    this.pig.position.set(this.x, this.y);
    this.pig.zIndex = 1;
    this.pig.eventMode = "static";
    this.pig.cursor = "pointer";
    
    this.pig.nodeId = this.id;
    
    this.selected = false;
    this.isDragging = false;
    this.dragOffset = {};
    this.dragTimeout = 0;
    this.pointerId = null;
    
    gsap.from(this.pig.scale, {
      x: 0,
      y: 0,
      duration: 0.2,
      ease: "power4.inOut"
    });
    viewport.addChild(this.pig);
  };
  
  delete() {
    gsap.to(this.pig.scale, {
      x: 0,
      y: 0,
      duration: 0.15,
      ease: "power4.inOut",
      onComplete: () => {
        this.pig.destroy();
      }
    });
  }
  
  update(props) {
    if (props.x !== undefined) {
      this.pig.position.x = props.x;
      this.x = props.x;
    }
    if (props.y !== undefined) {
      this.pig.position.y = props.y;
      this.y = props.y;
    }
    if (props.label !== undefined) {
      this.label = props.label;
    }
  }
  
  selectToggle(state) {
    if (state === undefined) this.selected = !this.selected;
    else this.selected = state;
    
    if (this.selected) {
      this.pig.clear().circle(0, 0, 20).fill(NodeCol).stroke({width: 2, color: 0xFFFFFF});
      this.pig.position.set(this.x, this.y);
    }
    else {
      this.pig.clear().circle(0, 0, 20).fill(NodeCol);
      this.pig.position.set(this.x, this.y);
    }
  }
  
}

class Layer {
  constructor(props, viewport) {
    this.nodes = new Map();
    this.id = crypto.randomUUID();
    this.label = props.label;
    this.x = props.x;
    this.y = props.y;
    
    this.pig = new PIXI.Graphics().drawRect(0,0,60,60).fill({color: 0xFFFFFF, alpha: 0.2});
    this.pig.position.set(this.x, this.y);
    
    this.pig.layerId = this.id;
    
    viewport.addChild(this.pig);
  }
  
  addNeuron(neuron) {
    this.nodes.set(neuron.id, neuron);
  }
  
  nextPos() {
    return {x: this.x + 30, y: 30 + 60 * this.nodes.size};
  }
  
  setDim(valh, valw) {
    gsap.to(this.pig, {
      height: valh,
      width: valw,
      duration: 0.8,
      ease: "expo.inOut"
    });
  }
}