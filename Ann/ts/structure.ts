import type { Scene } from "@babylonjs/core/scene";

import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { GreasedLineMesh } from "@babylonjs/core/Meshes/GreasedLine/greasedLineMesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters";

import { Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";

//IMP:
//Float64 is used for ids, since that gives 2^53 = 9,007,199,254,740,991(9 quintillion) possible integer ids
//Float32 is too low, 2^24 = 16,777,216(just 16 million)

//Using Float32 for pos since there needs to be a large network before i need Float64

export interface NeuronData {
  id: number; 
  pos: Float32Array;
}

export interface SynapseData {
  id: number;
  ft: Float32Array; //size 6 [fx, fy, fz, ex, ey, ez]
}

export interface SynapseBatchData {
  id: number;
  ids: Float64Array;
  fts: number[][]; //[fx, fy, fz, ex, ey, ez, ...]. using number[][] since babylonjs 
}

export interface LayerData {
  id: number;
  pos: Float32Array;
  shape: Uint32Array; //Tensor visual thing
  ids: Float64Array; //child neuron ids
}

export class Network {
  memory: Map<string, Mesh | InstancedMesh | GreasedLineMesh>;
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
    neuronMaterial.emissiveFresnelParameters.leftColor = new Color3(0.1, 0.2, 0.3);
    neuronMaterial.emissiveFresnelParameters.rightColor = new Color3(0.15, 0.35, 0.5);
   
    this.baseNeuron.material = neuronMaterial;
    
    this.baseNeuron.setEnabled(false);


    this.layerMat = new StandardMaterial("layerMat", renderScene);
    this.layerMat.diffuseColor = new Color3(0.22, 0.27, 0.85);
    this.layerMat.alpha = 0.4;
    this.layerMat.emissiveColor = new Color3(0.5, 0.5, 0.5);
  }
  
  //0 = Layer, 1 = Neuron, 2 = Synapse, 4 = SynapseBatch
  newNeuron(data: NeuronData) {
    const mesh = this.baseNeuron.createInstance(`1_${data.id}`);
    mesh.position = new Vector3(data.pos[0], data.pos[1], data.pos[2]);
    
    this.memory.set(`1_${data.id}`, mesh);
  }
  
  newLayer(batch: LayerData, neuronSpacing: number) {
    const masterNeuron = CreateSphere(`0_${batch.id}`,{
      diameter: 2,
      segments: 14
    }, this.scene);
    masterNeuron.material = this.baseNeuron.material;

    const thinInstanceMatrix = new Float32Array(batch.ids.length * 16);
    
    //using pos.length and not ids.length due to its convenience(personally) in grabbing positions
    
    //bunch of suppresion '!' since i know what im doing(probably)
    //batch.pos[0:2] will never be null.
    for (let i = 0; i < batch.shape[0]!; i++) {
      for (let j = 0; j < batch.shape[1]!; j++) {
        for (let k = 0; k < batch.shape[2]!; k++) {
          Matrix.Translation(
            batch.pos[0]! + i * neuronSpacing,
            batch.pos[1]! + j * neuronSpacing,
            batch.pos[2]! + k * neuronSpacing
          ).copyToArray(thinInstanceMatrix, ((i * batch.shape[1]! + j) * batch.shape[2]! + k) * 16);
        }
      }
    }
    
    masterNeuron.thinInstanceSetBuffer("matrix", thinInstanceMatrix, 16);

    this.memory.set(`0_${batch.id}`, masterNeuron);
  }
  
  newSynapse(data: SynapseData) {
    const mesh = CreateGreasedLine(`2_${data.id}`, {
      points: data.ft
    }, {
      color: new Color3(1, 1, 1),
      width: 0.03
    },  this.scene) as GreasedLineMesh;
    
    this.memory.set(`2_${data.id}`, mesh);
  }
  
  newSynapseBatch(batch: SynapseBatchData) {
    let lineWidth = 0.04;
    
    if (batch.fts.length > 400 && batch.fts.length < 567) {
      lineWidth = 0.028;
    }
    else if (batch.fts.length > 567) {
      lineWidth = 0.024;
    }

    const mesh = CreateGreasedLine(`4_${batch.id}`, {
      points: batch.fts
    }, {
      color: new Color3(1, 1, 1),
      width: lineWidth
    }, this.scene) as GreasedLineMesh;
    
    this.memory.set(`4_${batch.id}`, mesh);
  }
  
  //Why is, basically a copy, of the newSynapseBatch function here?
  //its because all we need is a way to find the parent batch of a chunk, and the chunk index
  newSynapseBatchChunk(batchChunk: SynapseBatchData, chunkIndex: number) {
    let lineWidth = 0.04;
    
    if (batchChunk.fts.length > 400 && batchChunk.fts.length < 567) {
      lineWidth = 0.028;
    }
    else if (batchChunk.fts.length > 567) {
      lineWidth = 0.024;
    }

    //batchChunk.id is actuallly the id of the parent. 
    //thats confusing, but if it aint broke, dont fix it
    const mesh = CreateGreasedLine(`3_${batchChunk.id}_${chunkIndex}`, {
      points: batchChunk.fts
    }, {
      color: new Color3(1, 1, 1),
      width: lineWidth
    }, this.scene) as GreasedLineMesh;

    this.memory.set(`3_${batchChunk.id}_${chunkIndex}`, mesh)
  }
  
  
}