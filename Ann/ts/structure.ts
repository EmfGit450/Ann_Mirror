import type { Scene } from "@babylonjs/core/scene";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";


export class NeuronRender {
  neuron: Mesh;
  
  constructor(
    props: {x: number, y: number, z: number | undefined},
    scene: Scene
  ) {
    this.neuron = CreateSphere("neuron", {segments: 12, diameter: 2}, scene);
    
    const material = new StandardMaterial("neuronMaterial", scene);
    material.diffuseColor = new Color3(0.2, 0.345, 0.5254);
    material.emissiveColor = new Color3(0.2, 0.345, 0.5254);
    
    this.neuron.material = material;
    
    this.neuron.position.x = props.x;
    this.neuron.position.y = props.y;
    this.neuron.position.z = props.z ? props.z : 0;
  }
}


export class ANNRender {
  constructor() {
    
  }
}