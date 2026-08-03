import type { Scene } from "@babylonjs/core/scene";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { GreasedLineMesh } from "@babylonjs/core/Meshes/greasedLineMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters";
import { Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";

//IMP:
//Float64 is used for ids, since that gives 2^53 = 9,007,199,254,740,991(9 quintillion) possible integer ids
//Float32 is too low, 2^24 = 16,777,216(just 16 million)

//Using Float32 for pos since there needs to be a large network before i need Float64

export interface NeuronData {
  id: number; 
  pos: Float32Array;
}

export interface NeuronBatchData {
  id: number;
  ids: Float64Array;
  pos: Float32Array; // [x, y, z, x, y, z, ...]
}

export interface SynapseData {
  id: number;
  ft: Float64Array; //size 6 [fx, fy, fz, ex, ey, ez]
}

export interface SynapseBatchData {
  id: number;
  ids: Float64Array;
  fts: number[][]; //[fx, fy, fz, ex, ey, ez, ...]. using number[][] since babylonjs 
}

export interface LayerData {
  id: number;
  pos: Float32Array;
  shape: Int32Array; //Tensor visual thing
  ids: Float64Array; //child neuron ids
}

export class Network {
  memory: Map<number, InstancedMesh | GreasedLineMesh>;
  scene: Scene;
  
  private baseNeuron: Mesh;
  private layerMat: StandardMaterial;
  
  constructor(renderScene: Scene) {
    this.scene = renderScene;
    this.memory = new Map();
    
    this.baseNeuron = CreateSphere("sourceNeuron", { 
      diameter: 2,
      segments: 14
    }, renderScene);
    
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
  
  //0 = Layer, 1 = Neuron, 3 = NeuronBatch 2 = Synapse, 4 = SynapseBatch
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
  
  newNeuronBatch(batch: NeuronBatchData) {
    const masterMesh = this.baseNeuron.clone(`3_${batch.id}`);
    masterMesh.setEnabled(true);
    masterMesh.thinInstanceEnable = true;
    
    const thinInstanceMatrix = [];
    
    for (let i = 0; i < batch.pos.length; i += 3) {
      const matrix = Matrix.Translation(
        batch.pos[i],   //x
        batch.pos[i+1], //y
        batch.pos[i+2]  //z
      );
      thinInstanceMatrix.push(matrix);
    }
    
    masterMesh.thinInstanceAdd(thinInstanceMatrix);
  }
  
  newSynapse(data: SynapseData) {
    const mesh = CreateGreasedLine(`2_${data.id}`, {
      points: data.ft
    }, {
      color: new Color3(1, 1, 1),
      width: 0.03
    },  this.scene) as GreasedLineMesh;
    
    this.memory.set(data.id, mesh);
  }
  
  newSynapseBatch(batch: SynapseBatchData) {
    const mesh = CreateGreasedLine(`4_${batch.id}`, {
      points: batch.fts
    }, {
      color: new Color3(1, 1, 1),
      width: 0.03
    },  this.scene) as GreasedLineMesh;
    
    this.memory.set(batch.id, mesh);
  }
  
  
}