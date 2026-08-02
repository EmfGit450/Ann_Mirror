import type { Scene } from "@babylonjs/core/scene";
import { Camera } from "./camera";
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

//IMP:
//Float64 is used for ids, since that gives 2^53 = 9,007,199,254,740,991(9 quintillion) possible integer ids
//Float32 is too low, 2^24 = 16,777,216(just 16 million)

//Using Float32 for pos since there needs to be a large network before i need Float64

export interface NeuronData {
  id: number; 
  pos: Float32Array;
}

export interface NeuronBatchData {
  ids: Float64Array;
  pos: Float32Array
}

export interface SynapseData {
  id: number;
  ft: Float64Array; //size 6 [fx, fy, fz, ex, ey, ez]
}

export interface SynapseBatchData {
  id: number;
  ids: Float64Array;
  fts: number[][]; //[fx, fy, fz, ex, ey, ez, ...]. using number[][] since babylonjs
  mid: Float32Array; //size 3. [x, y, z]
}

export interface LayerData {
  id: number;
  pos: Float32Array;
  shape: Int32Array; //Tensor visual thing
}


export class Network {
  memory: Map<number, InstancedMesh | GreasedLineMesh>;
  scene: Scene;
  camera: Camera;
  
  private baseNeuron: Mesh;
  private layerMat: StandardMaterial;
  
  constructor(renderScene: Scene, renderCam: Camera) {
    this.scene = renderScene;
    this.camera = renderCam;
    
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
  
  newSynapseBatch(batch: SynapseBatchData) {
    //BUG: STUPID LOGIC BUG, lines 112 - 133 positive diff
    let repedX = 0, repedY = 0, repedZ = 0;
    let repX, repY, repZ;
    
    for (let i = 0; i < batch.fts.length; i++) {
      const startX = batch.fts[i][0];
      const startY = batch.fts[i][1];
      const startZ = batch.fts[i][2];
      
      const endX = batch.fts[i][3];
      const endY = batch.fts[i][4];
      const endZ = batch.fts[i][5];
      
      if (startX === repX) {
        repedX++;
        if (repedX > 100) batch.fts.splice(i, i);
      }
      else if (startY === repY) {
        repedY++;
        if (repedY > 100) batch.fts.splice(i, i);
      }
      else if (startZ === repZ) {
        repedZ++;
        if (repedZ > 100) batch.fts.splice(i, i);
      }
    }
    const mesh = CreateGreasedLine(`2_${batch.id}`, {
      points: batch.fts
    }, {
      color: new Color3(1, 1, 1),
      width: 0.03
    },  this.scene) as GreasedLineMesh;
    
    this.memory.set(batch.id, mesh);
  }
  
  renderSynapseBatches() {
    
  }
  
  
}