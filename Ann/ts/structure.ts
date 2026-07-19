import type { Scene } from "@babylonjs/core/scene";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";
import type { GreasedLineMesh } from "@babylonjs/core/Meshes/GreasedLine/greasedLineMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

export interface NeuronData {
  id: number; 
  x: number; //x or layer index
  y: number; //y or horizontal index
  z: number; //z or vertical index
}
//Matrix shapes for layers

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
  memory: Map<number, InstancedMesh | GreasedLineMesh>;
  scene: Scene;
  
  private baseNeuron: Mesh;
  
  constructor(renderScene: Scene) {
    this.scene = renderScene;
    this.memory = new Map();
    
    
    this.baseNeuron = CreateSphere("sourceNeuron", { diameter: 2, segments: 16 }, renderScene);
    
    const neuronMaterial = new StandardMaterial("hologramBlue", renderScene);
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
  
  //1 = Neuron, 2 = Synapse
  newNeuron(data: NeuronData) {
    const neuron = this.baseNeuron.createInstance(`1_${data.id}`);
    neuron.position = new Vector3(data.x, data.y, data.z);
    
    this.memory.set(data.id, neuron);
  }
  
  newSynapse(data: SynapseData) {
    const path = [this.memory.get(data.start)?.position, this.memory.get(data.end)?.position];
    
    const synapse = CreateGreasedLine(`2_${data.id}`, { 
      points: path,
      widths: [0.02, 0.02],
    }, {
        color: new Color4(1, 1, 1, 0.1)
    }, this.scene) as GreasedLineMesh;
    
    this.memory.set(data.id, synapse);
  }
}