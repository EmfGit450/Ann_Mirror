let Synapses = new Map();
let Layers = new Map();

class Neuron {
  constructor(props, viewport) {
    this.x = props.x;
    this.y = props.y;
    this.id = crypto.randomUUID();
    this.label = props.label;
    this.layer = viewport.layerId;
    
    this.pig = new PIXI.Graphics().circle(0, 0, 20).fill(0x8BBBF8);
    this.pig.position.set(this.x, this.y);
    this.pig.zIndex = 2;
    this.pig.eventMode = "static";
    this.pig.cursor = "pointer";
    
    this.pig.nodeId = this.id;
    
    this.selected = false;
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
    if (props.x) {
      this.pig.position.x = props.x;
      this.x = props.x;
    }
    if (props.y) {
      this.pig.position.y = props.y;
      this.y = props.y;
    }
    if (props.label) {
      this.label = props.label;
    }
  }
  
}

class Synapse {}

class Layer {
  constructor(props, viewport) {
    this.nodes = new Map();
    console.log(this.nodes)
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
    
    Layers.set(this.id, this);
    viewport.addChild(this.pig);
  }
  redraw() {
    this.pig.clear().drawRoundedRect(0, 0, this.width, this.height, 8).fill({color: 0x3A3B47, alpha: 0.7});
  }
  nextPos() {
    return {x: 30, y: 30 + 60 * this.nodes.size};
  }
  
  setShape(valh, valw) {
    gsap.to(this, {
      height: valh,
      width: valw,
      duration: 0.1,
      ease: "expo.inOut",
      onUpdate: () => this.redraw()
    });
  }
  
  addNeuron() {
    const pos = this.nextPos();
    const newNeuron = new Neuron({x: pos.x, y: pos.y}, this.pig);
    
    this.nodes.set(newNeuron.id, newNeuron);
    
    this.setShape(this.nodes.size * 60, 60)
  }
  deleteNeuron(neuron) {
    this.nodes.delete(neuron.id);
  }
}