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

const NEURON_SPACING = 2.5;

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
  fts: Float32Array[]; //[fx, fy, fz, ex, ey, ez, ...]
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
    
    
    this.scene.registerBeforeRender(() => {
      [...this.memory.values()].forEach(mesh => {
        //if (mesh.annMeta.visible === undefined) return;
        
        
        if (mesh.name[0] == "0") {
          
        }


      });
    });
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

    const sx = batch.pos[0]! - ((batch.shape[0]! - 1) * NEURON_SPACING) / 2;
    const sy = batch.pos[1]! - ((batch.shape[1]! - 1) * NEURON_SPACING) / 2;
    const sz = batch.pos[2]! - ((batch.shape[2]! - 1) * NEURON_SPACING) / 2;

    const idsUndefined = batch.ids ? true : false;
    
    const thinInstanceMatrix = new Float32Array(idsUndefined ? batch.ids!.length * 16 : (batch.shape[0]! * batch.shape[1]! * batch.shape[2]!) * 16);
    
    let offset = 0;
    
    for (let i = 0; i < batch.shape[0]!; i++) {
      const x = sx + i * NEURON_SPACING;
      for (let j = 0; j < batch.shape[1]!; j++) {
        const y = sy + j * NEURON_SPACING;
        for (let k = 0; k < batch.shape[2]!; k++) {
          const z = sz + k * NEURON_SPACING;
          
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

  newDenseSynapseBatch(layerA: LayerData, layerB: LayerData) {
    //NO ID CONFIG FOR NOW, ONLY PERFORMANCE TESTING
    let base_fts: Float32Array[] = [];
    let detail_fts: Float32Array[] = [];
    let high_detail_fts: Float32Array[] = [];
 
    //lxnC = layer x neuron count
    const lAnC = layerA.shape[0]! * layerA.shape[1]! * layerA.shape[2]!
    const lBnC = layerB.shape[0]! * layerB.shape[1]! * layerB.shape[2]!

    const lAneurons = (this.memory.get(`0_${layerA.id}`)! as Mesh)._thinInstanceDataStorage.matrixData!;
    const lBneurons = (this.memory.get(`0_${layerB.id}`)! as Mesh)._thinInstanceDataStorage.matrixData!;
    
    const lAZshape = layerA.shape[2]! * 16;
    const vRef = [lBneurons[12]! - lAneurons[12]!, lBneurons[13]! - lAneurons[13]!, lBneurons[14]! - lAneurons[14]!];
    const vXZ = [lBneurons[12]! - lAneurons[28]!, lBneurons[13]! - lAneurons[29]!, lBneurons[14]! - lAneurons[30]!];
    const vXY = [lBneurons[12]! - lAneurons[lAZshape + 12]!, lBneurons[13]! - lAneurons[lAZshape + 13]!, lBneurons[14]! - lAneurons[lAZshape + 14]!];

    const vRef_mag = Math.sqrt(vRef[0]! * vRef[0]! + vRef[1]! * vRef[1]! + vRef[2]! * vRef[2]!);
    const vXZ_mag = Math.sqrt(vXZ[0]! * vXZ[0]! + vXZ[1]! * vXZ[1]! + vXZ[2]! * vXZ[2]!);
    const vXY_mag = Math.sqrt(vXY[0]! * vXY[0]! + vXY[1]! * vXY[1]! + vXY[2]! * vXY[2]!);

    const dot_xz = (vRef[0]! * vXZ[0]! + vRef[1]! * vXZ[1]! + vRef[2]! * vXZ[2]!) * (1 / (vRef_mag * vXZ_mag));
    const dot_xy = (vRef[0]! * vXY[0]! + vRef[1]! * vXY[1]! + vRef[2]! * vXY[2]!) * (1 / (vRef_mag * vXY_mag));

    let skipMod = dot_xz > 0.99802 ? 2 : 1;    // ~3.5°
    skipMod = dot_xz > 0.99926  ? 3 : skipMod; // ~2.2°
    skipMod = dot_xz > 0.99965 ? 4 : skipMod;  // ~1.5°

    
    const centerV = [layerB.pos[0]! - layerA.pos[0]!, layerB.pos[1]! - layerA.pos[1]!, layerB.pos[2]! - layerA.pos[2]!]
    const centerV_mag = Math.sqrt(centerV[0]! * centerV[0]! + centerV[1]! * centerV[1]! + centerV[2]! * centerV[2]!)
    
    let synapseCounter = 0;

    for (let start = 1; start < lAnC; start += 2) {
      const currStart = start * 16;
      for (let end = 0; end < lBnC; end++) {
        const currEndOff = end * 16;
        
        const source1_mag = Math.sqrt(lAneurons[currStart + 12]! * lAneurons[currStart + 12]! + lAneurons[currStart + 13]! * lAneurons[currStart + 13]! + lAneurons[currStart + 14]! * lAneurons[currStart + 14]!);
        const source2_mag = Math.sqrt(lAneurons[currStart - 4]! * lAneurons[currStart - 4]! + lAneurons[currStart - 3]! * lAneurons[currStart - 3]! + lAneurons[currStart - 2]! * lAneurons[currStart - 2]!);

        const dot1xz = (centerV[0]! * lAneurons[currStart + 12]! + centerV[1]! * lAneurons[currStart + 13]! + centerV[2]! * lAneurons[currStart + 14]!) * (1 / (centerV_mag * source1_mag));
        const dot2xz = (centerV[0]! * lAneurons[currStart - 4]! + centerV[1]! * lAneurons[currStart - 3]! + centerV[2]! * lAneurons[currStart - 2]!) * (1 / (centerV_mag * source2_mag));
        
        const mod = synapseCounter % skipMod;

        if (mod == 0) {
          base_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart - 4]!, lAneurons[currStart - 3]!, lAneurons[currStart - 2]! //source2
          ]));
        }
        else if (mod == 1) { //
          detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart - 4]!, lAneurons[currStart - 3]!, lAneurons[currStart - 2]! //source2
          ]));
        }
        else if (mod == 2) { //
          high_detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart - 4]!, lAneurons[currStart - 3]!, lAneurons[currStart - 2]! //source2
          ]));
        }
        else {
          high_detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart - 4]!, lAneurons[currStart - 3]!, lAneurons[currStart - 2]! //source2
          ]));
        }

        synapseCounter++;
      }
    }
    
    console.log(`dot: ${dot_xz}, ${dot_xy}\nangle(deg): ${Math.acos(dot_xz) * DEG180BYPI}, ${Math.acos(dot_xy) * DEG180BYPI}`)
    
    const metadata = {
      sourceCenter: layerA.pos,
      targetCenter: layerB.pos,
      density: undefined,
      visible: undefined
    }

    const baseMesh = CreateGreasedLine(`4_${randInt53()}_B}`, {
      points: base_fts
    }, {
      width: 0.02
    }, this.scene);
    
    //@ts-ignore
    baseMesh.annMeta = metadata;
    //@ts-ignore
    baseMesh.annMeta.density = {
      xz: Math.acos(dot_xz) * DEG180BYPI,
      xy: Math.acos(dot_xy) * DEG180BYPI
    }

    this.memory.set(`4_${baseMesh.name}_B`, baseMesh);
    
    if (detail_fts.length > 0) {
      const detailMesh = CreateGreasedLine(`4_${randInt53()}_D`, {
        points: detail_fts
      }, {
        width: 0.02
      }, this.scene);
      
      //@ts-ignore
      detailMesh.annMeta = metadata;
      //@ts-ignore
      detailMesh.annMeta.visible = false;

      this.memory.set(`4_${detailMesh.name}_D`, detailMesh);
    }

    if (high_detail_fts.length > 0) {
      const highDetailMesh = CreateGreasedLine(`4_${randInt53()}_H`, {
        points: high_detail_fts
      }, {
        width: 0.02
      }, this.scene);
      
      //@ts-ignore
      highDetailMesh.annMeta = metadata;
      //@ts-ignore
      highDetailMesh.annMeta.visible = false;

      this.memory.set(`4_${highDetailMesh.name}_D`, highDetailMesh);
    }

    console.log(`base.fts.length: ${base_fts.length}\ndetail.fts.length: ${detail_fts.length}\nhigh.fts.length: ${high_detail_fts.length}`)
  }
  
}