class Neuron {
  constructor(props, viewport) {
    this.x = props.x;
    this.y = props.y;
    this.id = crypto.randomUUID();
    this.label = props.label;
    
    this.pig = new PIXI.Graphics().circle(0, 0, 20).fill(0x8BBBF8);
    this.pig.position.set(this.x, this.y);
    this.pig.zIndex = 2;
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
  
}

class Synapse {}

class Layer {
  constructor(props, viewport) {
    this.nodes = new Map();
    this.id = crypto.randomUUID();
    this.label = props.label;
    this.x = props.x;
    this.y = props.y;
    
    this.width = 60;
    this.height = 60;
    
    this.pig = new PIXI.Graphics().drawRoundedRect(0,0,60,60,8).fill({color: 0x3A3B47, alpha: 0.7});
    this.pig.position.set(this.x, this.y);
    this.pig.zIndex = 0;
    
    this.pig.eventMode = "static"
    this.pig.cursor = "pointer"
    
    this.pig.layerId = this.id;
    
    viewport.addChild(this.pig);
  }
  redraw() {
    this.pig.clear().drawRoundedRect(0, 0, this.width, this.height, 8).fill({color: 0x3A3B47, alpha: 0.7});
  }
  addNeuron(neuron) {
    this.nodes.set(neuron.id, neuron);
  }
  
  nextPos() {
    return {x: this.x + 30, y: this.y + 30 + 60 * this.nodes.size};
  }
  
  setDim(valh, valw) {
    gsap.to(this, {
      height: valh,
      width: valw,
      duration: 0.1,
      ease: "expo.inOut",
      onUpdate: () => this.redraw()
    });
  }
}