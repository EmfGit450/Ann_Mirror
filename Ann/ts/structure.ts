import type { Scene } from "@babylonjs/core/scene";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export interface NeuronData {
  id: number; 
  type: number; //inside a layer or free floating
  layerOx: number; //layer index
  neuronOy: number; //neuron index
}

export interface LayerData {
  network: number; //network index
  size: number;
  id: number;
}

export class Network {
  memory: Map<string, InstancedMesh>;
  private baseNeuron: Mesh;
  
  constructor(scene: Scene) {
    this.memory = new Map();
    
    this.baseNeuron = CreateSphere("sourceNeuron", { diameter: 2, segments: 18 }, scene);
    
    const material = new StandardMaterial("glowblue", scene);
    material.diffuseColor = new Color3(0.2, 0.6, 1.0);
    material.emissiveColor = new Color3(0.1, 0.3, 0.5);
    this.baseNeuron.material = material;
    
    this.baseNeuron.setEnabled(false);
  }
  
  newNeuron(data: NeuronData) {
    const neuron = this.baseNeuron.createInstance(data.id);
    neuron.position = new Vector3(data.layerOx, data.neuronOy, 0);
    
    this.memory.set(data.id, neuron);
  }
}