import type { Scene } from "@babylonjs/core/scene";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateTube } from "@babylonjs/core/Meshes/Builders/tubeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
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

export interface SynapseData {
  id: number;
  start: number;
  end: number;
}

export interface LayerData {
  network: number; //network index
  size: number;
  id: number;
}

export class Network {
  memory: Map<number, InstancedMesh>;
  scene: Scene;
  
  private baseNeuron: Mesh;
  private synapseMaterial: StandardMaterial;
  
  constructor(renderScene: Scene) {
    this.scene = renderScene;
    this.memory = new Map();
    
    
    this.baseNeuron = CreateSphere("sourceNeuron", { diameter: 2, segments: 16 }, renderScene);
    
    const neuronMaterial = new StandardMaterial("glowblue", renderScene);
    neuronMaterial.diffuseColor = new Color3(0.2, 0.6, 1.0);
    neuronMaterial.emissiveColor = new Color3(0.1, 0.3, 0.5);
    this.baseNeuron.material = neuronMaterial;
    
    this.baseNeuron.setEnabled(false);
    
    
    this.synapseMaterial = new StandardMaterial("synapseMaterial", renderScene);
    this.synapseMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
    this.synapseMaterial.emissiveColor = new Color3(0.4, 0.4, 0.4);
  }
  
  newNeuron(data: NeuronData) {
    const neuron = this.baseNeuron.createInstance(data.id);
    neuron.position = new Vector3(data.layerOx, data.neuronOy, 0);
    
    this.memory.set(data.id, neuron);
  }
  
  newSynapse(data: SynapseData) {
    const synapse = CreateTube(data.id, {
      path: [this.memory.get(data.start).position, this.memory.get(data.end).position],
      radius: 0.07,
      tessellation: 6,
      cap: Mesh.CAP_NONE
    }, this.scene);
    
    synapse.material = this.synapseMaterial;
    
    this.memory.set(data.id, data);
  }
}