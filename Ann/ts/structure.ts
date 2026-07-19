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
import {CreateBox} from "@babylonjs/core/Meshes/Builders/boxBuilder";
import {AnnCamera} from "./camera";

export interface NeuronData {
  id: number; 
  x: number; //x or layer index
  y: number; //y or horizontal index
  z: number; //z or vertical index
}
//Matrix shapes for layers

export interface SynapseData {
  id: number;
  start: number; //neuron or layer
  end: number; //neuron or layer
}

export interface LayerData {
  id: number;
  pos: Float32Array;
  shape: Float32Array;
}

export class Network {
  memory: Map<number, InstancedMesh | GreasedLineMesh>;
  scene: Scene;
  
  private baseNeuron: Mesh;
  private layerMat: StandardMaterial;
  
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


    this.layerMat = new StandardMaterial("mat", scene);
    this.layerMat.diffuseColor = new Color3(0.22, 0.27, 0.85);
    this.layerMat.alpha = 0.4;
    this.layerMat.emissiveColor = new Color3(0.5, 0.5, 0.5);
  }
  
  //0 = Layer, 1 = Neuron, 2 = Synapse
  newLayer(data: LayerData) {
    const mesh = CreateBox(`0_${data.id}`, { size: 1 }, this.scene);
    mesh.material = this.layerMat;

    mesh.position = new Vector3(data.pos[0], data.pos[1], data.pos[2]);
  }

  newNeuron(data: NeuronData) {
    const mesh = this.baseNeuron.createInstance(`1_${data.id}`);
    mesh.position = new Vector3(data.x, data.y, data.z);
    
    this.memory.set(data.id, mesh);
  }
  
  newSynapse(data: SynapseData) {
    const path = [this.memory.get(data.start)?.position, this.memory.get(data.end)?.position];
    
    const mesh = CreateGreasedLine(`2_${data.id}`, {
      points: path as Vector3[],
      widths: [0.02, 0.02],
    }, {
        color: new Color4(1, 1, 1, 0.1)
    }, this.scene) as GreasedLineMesh;
    
    this.memory.set(data.id, mesh);
  }
}