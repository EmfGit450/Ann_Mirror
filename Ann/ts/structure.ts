import type { Scene } from "@babylonjs/core/scene";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";
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
  shape: Int16Array;
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
  
  //0 = Layer, 1 = Neuron, 2 = SynapseBatch
  newLayer(data: LayerData) {
    const mesh = CreateBox(`0_${data.id}`, { size: 1 }, this.scene);
    mesh.material = this.layerMat;

    mesh.position = new Vector3(data.pos[0], data.pos[1], data.pos[2]);
  }

  newNeuron(data: NeuronData) {
    const mesh = this.baseNeuron.createInstance(`1_${data.id}`);
    mesh.position = new Vector3(data.pos[0], data.pos[1], data.pos[2]);
    
    this.memory.set(data.id, mesh);
  }
  
  newSynapses(dataBatch: SynapseData[]) {
    const linePoints = []; 
    //each synapse has a start and end neuron, two vertices, each has x, y, z coords, 6
    
    for (let i = 0; i < dataBatch.length; i++) {
      const data = dataBatch[i];
      
      const start = this.memory.get(data.start).position;
      const end = this.memory.get(data.end).position;
      
      const line = new Array(6);
      line[0] = start.x;
      line[1] = start.y;
      line[2] = start.z;
      
      line[3] = end.x;
      line[4] = end.y;
      line[5] = end.z;
      
      linePoints.push(line);
    }
    
    const mesh = CreateGreasedLine(`2_${linePoints.length}`, {
      points: linePoints
    }, {
      color: new Color3(1, 1, 1),
      width: 0.04
    },  this.scene) as GreasedLineMesh;
    
    this.memory.set(linePoints.length, mesh);
  }
}