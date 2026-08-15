import type { Scene } from "@babylonjs/core/scene";

import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { GreasedLineMesh } from "@babylonjs/core/Meshes/GreasedLine/greasedLineMesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";

//IMP:
//Float64 is used for ids, since that gives 2^53 = 9,007,199,254,740,991(9 quintillion) possible integer ids
//Float32 is too low, 2^24 = 16,777,216(just 16 million)

//Using Float32 for pos since there needs to be a large network before i need Float64

const DEG180BYPI = 57.2957795147;

export function randInt53(): number {
  const buf = new Uint8Array(7);
  crypto.getRandomValues(buf);
  buf[0]! &= 0b00011111;

  const view = new DataView(buf.buffer, buf.byteOffset);
  // Read as little-endian, handling the 7-byte limitation
  return view.getUint32(0, true) + view.getUint16(4, true) * 0x100000000 + buf[6]! * 0x10000000000;
}

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
  ids: Float64Array | undefined; //child neuron ids
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
    neuronMaterial.emissiveColor = new Color3(0.05, 0.15, 0.25);

    neuronMaterial.specularColor = new Color3(0,0,0);
    neuronMaterial.specularPower = 1;
    neuronMaterial.disableLighting = false;
   
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
  
  newLayer(batch: LayerData) {
    const masterNeuron = CreateSphere(`0_${batch.id}`, {
      diameter: 2,
      segments: 14
    }, this.scene);
    masterNeuron.material = this.baseNeuron.material;

    const sx = batch.pos[0]! - ((batch.shape[0]! - 1) * 2.5) / 2;
    const sy = batch.pos[1]! - ((batch.shape[1]! - 1) * 2.5) / 2;
    const sz = batch.pos[2]! - ((batch.shape[2]! - 1) * 2.5) / 2;

    const idsUndefined = batch.ids ? true : false;
    
    const thinInstanceMatrix = new Float32Array(idsUndefined ? batch.ids!.length * 16 : (batch.shape[0]! * batch.shape[1]! * batch.shape[2]!) * 16);
    
    //using pos.length and not ids.length due to its convenience(personally) in grabbing positions
    
    //lots of suppresion '!'
    //batch.pos[0:2] will never be null.
    let offset = 0;
    
    for (let i = 0; i < batch.shape[0]!; i++) {
      const x = sx + i * 2.5;
      for (let j = 0; j < batch.shape[1]!; j++) {
        const y = sy + j * 2.5;
        for (let k = 0; k < batch.shape[2]!; k++) {
          const z = sz + k * 2.5;
          
          //babylonjs uses column major notation
          thinInstanceMatrix[offset] = 1;
          thinInstanceMatrix[offset + 5] = 1;
          thinInstanceMatrix[offset + 10] = 1;
          thinInstanceMatrix[offset + 12] = x;
          thinInstanceMatrix[offset + 13] = y;
          thinInstanceMatrix[offset + 14] = z;
          thinInstanceMatrix[offset + 15] = 1;
          
          offset += 16;
        }
      }
    }
    
    masterNeuron.thinInstanceSetBuffer("matrix", thinInstanceMatrix, 16, true);

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
    const from1 = [batch.fts[0]![0], batch.fts[0]![1], batch.fts[0]![2]];
    const from2 = [batch.fts[1]![0], batch.fts[1]![1], batch.fts[1]![2]];
    const from3 = [batch.fts[batch.ftshape[2]!]![0], batch.fts[batch.ftshape[2]!]![1], batch.fts[batch.ftshape[2]!]![2]]; //batch.ftshape[2] is the z-shape of the 'from' layer
    
    const to = [batch.fts[0]![3], batch.fts[0]![4], batch.fts[0]![5]];
    
    const vRef = [from1[0]! - to[0]!, from1[1]! - to[1]!, from1[2]! - to[2]!];
    const vZ = [from2[0]! - to[0]!, from2[1]! - to[1]!, from2[2]! - to[2]!];
    const vY = [from3[0]! - to[0]!, from3[1]! - to[1]!, from3[2]! - to[2]!];
    
    const vRef_mag = Math.sqrt(vRef[0]! * vRef[0]! + vRef[1]! * vRef[1]! + vRef[2]! * vRef[2]!);
    const vZ_mag = Math.sqrt(vZ[0]! * vZ[0]! + vZ[1]! * vZ[1]! + vZ[2]! * vZ[2]!);
    const vY_mag = Math.sqrt(vY[0]! * vY[0]! + vY[1]! * vY[1]! + vY[2]! * vY[2]!);
    
    //normalised so larger vectors dont affect density
    vRef[0]! /= vRef_mag;
    vRef[1]! /= vRef_mag;
    vRef[2]! /= vRef_mag;
    
    vZ[0]! /= vZ_mag;
    vZ[1]! /= vZ_mag;
    vZ[2]! /= vZ_mag;
    
    vY[0]! /= vY_mag;
    vY[1]! /= vY_mag;
    vY[2]! /= vY_mag;
    
    const dot_z = vRef[0]! * vZ[0]! + vRef[1]! * vZ[1]! + vRef[2]! * vZ[2]!;
    const dot_y = vRef[0]! * vY[0]! + vRef[1]! * vY[1]! + vRef[2]! * vY[2]!;
    
    console.log(`id: ${batch.id}\nZ_dot_angle: ${dot_z}, ${Math.acos(dot_z) * DEG180BYPI} \nY_dot_angle: ${dot_y}, ${Math.acos(dot_y) * DEG180BYPI}`);
    
    const mesh = CreateGreasedLine(`4_${batch.id}`, {
      points: batch.fts
    }, {
      width: 0.02
    }, this.scene);
    
    //@ts-ignore
    mesh.annInfo ??= { density: {} }
    //@ts-ignore
    mesh.annInfo.density.z_dot = dot_z;
    //@ts-ignore
    mesh.annInfo.density.y_dot = dot_y;

    this.memory.set(`4_${batch.id}`, mesh);
  }

  fullyConnectLayers(layerA: LayerData, layerB: LayerData) {
    let fts: Float32Array[] = [];

    //lxnC = layer x neuron count
    const lAnC = layerA.shape[0]! * layerA.shape[1]! * layerA.shape[2]!
    const lBnC = layerB.shape[0]! * layerB.shape[1]! * layerB.shape[2]!

    const lAneurons = (this.memory.get(`0_${layerA.id}`)! as Mesh)._thinInstanceDataStorage.matrixData!;
    const lBneurons = (this.memory.get(`0_${layerB.id}`)! as Mesh)._thinInstanceDataStorage.matrixData!;
    
    for (let end = 1; end < lAnC; end++) {
      const currEndMat = end * 16;
      for (let start = 0; start < lBnC; start++) {
        const currStartMat = start * 16;
        fts.push(new Float32Array([
          lAneurons[currEndMat + 12]!, lAneurons[currEndMat + 13]!, lAneurons[currEndMat + 14]!,
          lBneurons[currEndMat + 12]!, lAneurons[currEndMat + 13]!, lAneurons[currEndMat + 14]!,
          lAneurons[currEndMat - 4]!, lAneurons[currEndMat - 3]!, lAneurons[currEndMat - 2]!
        ]));
      }
    }
  }
  
}