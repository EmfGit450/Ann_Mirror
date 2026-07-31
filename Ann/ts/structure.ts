import type { Scene } from "@babylonjs/core/scene";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLines, CreateGreasedLineSystem } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { GreasedLineMesh } from "@babylonjs/core/Meshes/greasedLineMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";

export interface NeuronData {
  id: number; 
  pos: Float32Array;
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
  shape: Int8Array;
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


    this.layerMat = new StandardMaterial("layerMat", renderScene);
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
  
  newSynapse(dataBatch: SynapseData[]) {
    const linePoints = new Float32Array(dataBatch.length * 6); 
    //each synapse has a start and end neuron, two vertices, each has x, y, z coords, 6
    
    for (let i = 0; i < linePoints.length; i += 6) {
      const data = dataBatch[i / 6];
      
      const start = this.memory.get(data.start).position;
      const end = this.memory.get(data.end).position;
      
      linePoints[i] = start.x;
      linePoints[i+1] = start.y;
      linePoints[i+2] = start.z;
      
      linePoints[i+3] = end.x;
      linePoints[i+4] = end.y;
      linePoints[i+5] = end.z;
    }
    
    const mesh = CreateGreasedLineSystem(`2_${linePoints.length}`, {
      lines: linePoints,
    }, this.scene) as GreasedLineMesh;
    
    mesh.color = new Color3(1, 1, 1);
    
    this.memory.set(mesh.name, mesh);
  }
}