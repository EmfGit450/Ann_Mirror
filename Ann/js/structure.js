import * as PIXI from "pixi";
import {gsap} from "gsap";

export const Synapses = new Map();
export const Layers = new Map();

export const Grid = 60;
export const Pad = 6;
export const GridPad = 66;

export class Neuron {
  constructor(props, viewport) {
    this.x = props.x;
    this.y = props.y;
    this.id = crypto.randomUUID();
    this.label = props.label;
    this.layer = viewport.layerId;
    this.activationType = "identity";
    
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

export class Layer {
  constructor(props, viewport) {
    this.neurons = new Map();
    this.id = crypto.randomUUID();
    this.label = props.label;
    this.activationType = "identity";
    this.x = props.x;
    this.y = props.y;
    
    this.width = 60;
    this.height = 0;
    
    this.pig = new PIXI.Graphics().roundRect(0,0,60,0,8).fill({color: 0x3A3B47, alpha: 0.7});
    this.pcontainer = new PIXI.Container();
    
    this.pcontainer.position.set(this.x, this.y);
    this.pcontainer.zIndex = 0;
    this.pcontainer.eventMode = "static";
    this.pcontainer.cursor = "pointer";
    this.pcontainer.layerId = this.id;
    
    this.pcontainer.addChild(this.pig);
    
    Layers.set(this.id, this);
    viewport.addChild(this.pcontainer);
    
    this.setShape(60, 60, 0.4);
  }
  redraw() {
    this.pig.clear().roundRect(0, 0, this.width, this.height, 8).fill({color: 0x3A3B47, alpha: 0.7});
  }
  nextPos() {
    return {x: 30, y: 30 + this.neurons.size * (Grid+Pad)};
  }
  lastNode() {
    let last;
    for (last of this.neurons.keys()) {}
    return last;
  }
  
  delete() {
    this.neurons.forEach(neuron => neuron.delete());
    gsap.to(this, {
      height: 0,
      duration: 0.3,
      ease: "expo.inOut",
      onUpdate: () => this.redraw(),
      onComplete: () => {
        this.neurons = null;
      }
    });
  }
  
  setShape(valh, valw, time) {
    gsap.to(this, {
      height: valh,
      width: valw,
      duration: time ? time : 0.1,
      ease: "expo.inOut",
      onUpdate: () => this.redraw()
    });
  }
  
  addNeuron() {
    const pos = this.nextPos();
    const newNeuron = new Neuron({x: pos.x, y: pos.y}, this.pig);
    
    this.neurons.set(newNeuron.id, newNeuron);
    
    const index = this.neurons.size;
    this.setShape(index * Grid + (index-1) * Pad, 60);
  }
  deleteNeuron(neuron) {
    const targetId = neuron ? neuron.id : this.lastNode();
    const target = this.neurons.get(targetId);
    if (!target) return;
    target.delete();
    
    this.neurons.delete(targetId);
    
    const rows = Math.max(1, this.neurons.size);
    this.setShape(rows * Grid, 60);
  }
}

export class Comment {
  constructor(props, viewport) {
    this.x = props.x;
    this.y = props.y;
    this.ptext = new PIXI.Text({
      text: props.text,
      style: {
        fontFamily: "Jetbrains Mono",
        fontSize: 16,
        fill: 0xFFFFFF
      }
    });
  }
}