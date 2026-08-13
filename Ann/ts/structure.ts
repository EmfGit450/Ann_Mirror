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

const DEG180BYPI = 57.2957795147;

export interface NeuronData {
  id: number; 
  pos: Float32Array;
}

export interface SynapseData {
  id: number;
  ft: Float32Array; //size 6 [fx, fy, fz, ex, ey, ez]
}

export interface SynapseBatchData { //one weight matrix
  id: number;
  ids: Float64Array;
  fts: number[][]; //[fx, fy, fz, ex, ey, ez, ...]. using number[][] since babylonjs
  ftshape: Float32Array; //[fx, fy, fz, tx, ty, tz]
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
    
    //lots of suppresion '!'
    //batch.pos[0:2] will never be null.
    let offset = 0;
    
    for (let i = 0; i < batch.shape[0]!; i++) {
      for (let j = 0; j < batch.shape[1]!; j++) {
        for (let k = 0; k < batch.shape[2]!; k++) {
          //babylonjs uses column major notation
          thinInstanceMatrix[offset] = 1;
          thinInstanceMatrix[offset + 1] = 0;
          thinInstanceMatrix[offset + 2] = 0;
          thinInstanceMatrix[offset + 3] = 0;
          thinInstanceMatrix[offset + 4] = 0;
          thinInstanceMatrix[offset + 5] = 1;
          thinInstanceMatrix[offset + 6] = 0;
          thinInstanceMatrix[offset + 7] = 0;
          thinInstanceMatrix[offset + 8] = 0;
          thinInstanceMatrix[offset + 9] = 0;
          thinInstanceMatrix[offset + 10] = 1;
          thinInstanceMatrix[offset + 11] = 0;
          thinInstanceMatrix[offset + 12] = batch.pos[0]! + i * neuronSpacing;
          thinInstanceMatrix[offset + 13] = batch.pos[1]! + j * neuronSpacing;
          thinInstanceMatrix[offset + 14] = batch.pos[2]! + k * neuronSpacing;
          thinInstanceMatrix[offset + 15] = 1;
          
          offset += 16;
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
    const from1 = [batch.fts[0][0], batch.fts[0][1], batch.fts[0][2]];
    const from2 = [batch.fts[1][0], batch.fts[1][1], batch.fts[1][2]];
    const from3 = [batch.fts[batch.ftshape[2]][0], batch.fts[batch.ftshape[2]][1], batch.fts[batch.ftshape[2]][2]]; //batch.ftshape[2] is the z-shape of the 'from' layer
    
    const to = [batch.fts[0][3], batch.fts[0][4], batch.fts[0][5]];
    
    const vRef = [from1[0] - to[0], from1[1] - to[1], from1[2] - to[2]];
    const vZ = [from2[0] - to[0], from2[1] - to[1], from2[2] - to[2]];
    const vY = [from3[0] - to[0], from3[1] - to[1], from3[2] - to[2]];
    
    const vRef_mag = Math.sqrt(vRef[0] * vRef[0] + vRef[1] * vRef[1] + vRef[2] * vRef[2]);
    const vZ_mag = Math.sqrt(vZ[0] * vZ[0] + vZ[1] * vZ[1] + vZ[2] * vZ[2]);
    const vY_mag = Math.sqrt(vY[0] * vY[0] + vY[1] * vY[1] + vY[2] * vY[2]);
    
    //normalised so larger vectors dont affect density
    vRef[0] /= vRef_mag;
    vRef[1] /= vRef_mag;
    vRef[2] /= vRef_mag;
    
    vZ[0] /= vZ_mag;
    vZ[1] /= vZ_mag;
    vZ[2] /= vZ_mag;
    
    vY[0] /= vY_mag;
    vY[1] /= vY_mag;
    vY[2] /= vY_mag;
    
    const dot_z = vRef[0] * vZ[0] + vRef[1] * vZ[1] + vRef[2] * vZ[2];
    const dot_y = vRef[0] * vY[0] + vRef[1] * vY[1] + vRef[2] * vY[2];
    
    console.log(`id: ${batch.id}\nZ_dot_angle: ${dot_z}, ${Math.acos(dot_z) * DEG180BYPI} \nY_dot_angle: ${dot_y}, ${Math.acos(dot_y) * DEG180BYPI}`);
    
    //Hyperdensity, 9.976
    
    const mesh = CreateGreasedLine(`4_${batch.id}`, {
      points: batch.fts
    }, {
      width: 0.02
    }, this.scene);
  }
  
}