import type { Scene } from "@babylonjs/core/scene";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine, GreasedLineMeshWidthDistribution } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";
import type { GreasedLineMesh } from "@babylonjs/core/Meshes/GreasedLine/greasedLineMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

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
  memory: Map<number, Mesh | GreasedLineMesh>;
  scene: Scene;
  
  private baseNeuron: Mesh;
  private synapseMaterial: StandardMaterial;
  
  constructor(renderScene: Scene) {
    this.scene = renderScene;
    this.memory = new Map();
    
    
    this.baseNeuron = CreateSphere("sourceNeuron", { diameter: 2, segments: 16 }, renderScene);
    
    const neuronMaterial = new StandardMaterial("glowblue", this.scene);
    neuronMaterial.diffuseColor = new Color3(0.2, 0.6, 1.0);
    neuronMaterial.emissiveColor = new Color3(0.1, 0.3, 0.5);

    neuronMaterial.specularColor = new Color3(0,0,0);
    neuronMaterial.specularPower = 1;
    neuronMaterial.disableLighting = false;
    
    neuronMaterial.emissiveFresnelParameters = new FresnelParameters();
    neuronMaterial.emissiveFresnelParameters.power = 1.5;
    neuronMaterial.emissiveFresnelParameters.leftColor = new Color3(0.15, 0.35, 0.5);
    neuronMaterial.emissiveFresnelParameters.rightColor = new Color3(0.3, 0.7, 1.0);
   
    this.baseNeuron.material = neuronMaterial;
    
    this.baseNeuron.setEnabled(false);
  }
  
  newNeuron(data: NeuronData) {
    const neuron = this.baseNeuron.createInstance(`${data.id}`);
    neuron.position = new Vector3(data.layerOx, data.neuronOy, 0);
    
    this.memory.set(data.id, neuron);
  }
  
  newSynapse(data: SynapseData) {
    const path = [this.memory.get(data.start).position, this.memory.get(data.end).position];
    
    const synapse = CreateGreasedLine(`${data.id}`, { points: path }, {
        width: 1,
        color: new Color4(1, 1, 1, 0.3),
        dash: false,
    }, this.scene);
    
    this.memory.set(data.id, synapse);
  }
}